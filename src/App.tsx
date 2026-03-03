import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ReactFlowProvider } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import BoardCanvas from './components/BoardCanvas';
import JsonEditor from './components/JsonEditor';
import LeftPanel, { type SearchResult } from './components/LeftPanel';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { BoardProvider, useBoardDispatch, useBoardState } from './state/board';
import {
  exportState,
  importState as importBoardState,
  loadState,
  saveState,
} from './state/storage';
import type { BoardState, JsonObject, JsonValue } from './types/model';
import { parseJsonText } from './utils/json';
import { matchesSearchQuery } from './utils/search';

const highlights = [
  {
    title: 'Visual JSON Workbench',
    detail: 'Switch between tree, board, and raw text editing with no context loss.',
  },
  {
    title: 'Fast Search + Ref Links',
    detail: 'Find nested keys instantly and trace relationships across blocks.',
  },
  {
    title: 'Local-First Workflow',
    detail: 'Keep your data private with export/import support built in.',
  },
];

const metrics = [
  { label: 'Editing modes', value: '3' },
  { label: 'Keyboard actions', value: '20+' },
  { label: 'Focused objective', value: '1' },
];

const downloadFile = (name: string, content: string): void => {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

const nextBlockPosition = (blockCount: number) => ({
  x: 80 + (blockCount % 5) * 220,
  y: 80 + Math.floor(blockCount / 5) * 140,
});

const isRootObject = (value: JsonValue): value is JsonObject =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const addAttributeOnRootObject = (value: JsonValue): JsonValue => {
  if (!isRootObject(value)) return value;
  let idx = 1;
  let key = `new_attr_${idx}`;
  while (Object.prototype.hasOwnProperty.call(value, key)) {
    idx += 1;
    key = `new_attr_${idx}`;
  }
  return {
    ...value,
    [key]: '',
  };
};

const isRefObject = (value: JsonValue): value is { $ref: string } =>
  Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof (value as Record<string, unknown>).$ref === 'string',
  );

const resolveReferences = (
  value: JsonValue,
  blocksById: Map<string, BoardState['blocks'][string]>,
  seen: Set<string>,
): JsonValue => {
  if (Array.isArray(value)) {
    return value.map((item) => resolveReferences(item, blocksById, seen));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (isRefObject(value)) {
    const refId = value.$ref;
    if (seen.has(refId)) return value;
    const target = blocksById.get(refId);
    if (!target) return value;
    const nextSeen = new Set(seen);
    nextSeen.add(refId);
    return resolveReferences(target.data, blocksById, nextSeen);
  }

  const next: Record<string, JsonValue> = {};
  for (const [key, nested] of Object.entries(value as JsonObject)) {
    next[key] = resolveReferences(nested, blocksById, seen);
  }
  return next;
};

const resolveBlockValue = (state: BoardState, blockId: string): JsonValue | null => {
  const block = state.blocks[blockId];
  if (!block) return null;

  const byId = new Map(Object.values(state.blocks).map((candidate) => [candidate.id, candidate]));
  let seeded = block.data;
  if (isRootObject(seeded)) {
    const nextRoot: JsonObject = { ...seeded };
    for (const link of Object.values(state.links)) {
      if (link.sourceBlockId !== block.id || !link.sourceAttrKey) continue;
      const target = byId.get(link.targetBlockId);
      if (!target) continue;
      nextRoot[link.sourceAttrKey] = target.data;
    }
    seeded = nextRoot;
  }
  return resolveReferences(seeded, byId, new Set([block.id]));
};

const isCompositeValue = (value: JsonValue): value is JsonObject | JsonValue[] =>
  isRootObject(value) || Array.isArray(value);

const expandNestedJsonIntoLinkedBlocks = (
  currentState: BoardState,
  title: string,
  data: JsonValue,
): BoardState | null => {
  if (!isCompositeValue(data)) return null;

  const now = new Date().toISOString();
  const nextBlocks = { ...currentState.blocks };
  const nextPositions = { ...currentState.positions };
  const nextLinks = { ...currentState.links };

  const rootPosition = nextBlockPosition(Object.keys(currentState.blocks).length);
  let rowCursor = 1;
  const nextPosition = (depth: number) => {
    const position = {
      x: rootPosition.x + depth * 290,
      y: rootPosition.y + rowCursor * 130,
    };
    rowCursor += 1;
    return position;
  };

  const createTree = (value: JsonValue, blockTitle: string, depth: number): string => {
    const id = uuidv4();
    const position = depth === 0 ? rootPosition : nextPosition(depth);

    if (Array.isArray(value)) {
      const normalized: JsonValue[] = [];
      value.forEach((item, index) => {
        if (isCompositeValue(item)) {
          const childId = createTree(item, `${blockTitle}[${index}]`, depth + 1);
          normalized.push({ $ref: childId });
          const linkId = uuidv4();
          nextLinks[linkId] = {
            id: linkId,
            sourceBlockId: id,
            sourceAttrKey: String(index),
            targetBlockId: childId,
            label: `[${index}]`,
          };
          return;
        }
        normalized.push(item);
      });

      nextBlocks[id] = {
        id,
        title: blockTitle,
        data: normalized,
        createdAt: now,
        updatedAt: now,
      };
      nextPositions[id] = position;
      return id;
    }

    const normalized: JsonObject = {};
    for (const [key, nested] of Object.entries(value as JsonObject)) {
      const nextValue = nested as JsonValue;
      if (isCompositeValue(nextValue)) {
        const childId = createTree(nextValue, key, depth + 1);
        normalized[key] = { $ref: childId };
        const linkId = uuidv4();
        nextLinks[linkId] = {
          id: linkId,
          sourceBlockId: id,
          sourceAttrKey: key,
          targetBlockId: childId,
        };
        continue;
      }
      normalized[key] = nextValue;
    }

    nextBlocks[id] = {
      id,
      title: blockTitle,
      data: normalized,
      createdAt: now,
      updatedAt: now,
    };
    nextPositions[id] = position;
    return id;
  };

  const rootId = createTree(data, title, 0);

  return {
    ...currentState,
    blocks: nextBlocks,
    positions: nextPositions,
    links: nextLinks,
    selectedBlockId: rootId,
  };
};

const sortByCurrentPosition = (state: BoardState, a: string, b: string) => {
  const posA = state.positions[a] ?? { x: 0, y: 0 };
  const posB = state.positions[b] ?? { x: 0, y: 0 };
  if (posA.y !== posB.y) return posA.y - posB.y;
  if (posA.x !== posB.x) return posA.x - posB.x;
  return state.blocks[a].title.localeCompare(state.blocks[b].title);
};

const estimateBlockHeight = (data: JsonValue): number => {
  const BASE = 110;
  const ROW_HEIGHT = 20;
  const FOOTER = 30;
  const MAX_VISIBLE_ROWS = 7;

  if (Array.isArray(data)) {
    return BASE + Math.min(data.length, MAX_VISIBLE_ROWS) * ROW_HEIGHT + FOOTER;
  }
  if (isRootObject(data)) {
    return BASE + Math.min(Object.keys(data).length, MAX_VISIBLE_ROWS) * ROW_HEIGHT + FOOTER;
  }
  return 140;
};

const getHiddenDescendants = (
  state: BoardState,
  collapsedBlockIds: ReadonlySet<string>,
): Set<string> => {
  if (collapsedBlockIds.size === 0) return new Set<string>();

  const outgoing = new Map<string, string[]>();
  for (const link of Object.values(state.links)) {
    const next = outgoing.get(link.sourceBlockId) ?? [];
    next.push(link.targetBlockId);
    outgoing.set(link.sourceBlockId, next);
  }

  const hidden = new Set<string>();
  const seen = new Set<string>();
  const stack = [...collapsedBlockIds];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    for (const target of outgoing.get(current) ?? []) {
      if (!hidden.has(target)) {
        hidden.add(target);
        stack.push(target);
      }
    }
  }

  return hidden;
};

const formatPositionsLeftToRight = (
  state: BoardState,
  targetBlockIds?: ReadonlySet<string>,
): Record<string, { x: number; y: number }> => {
  const ids = targetBlockIds
    ? [...targetBlockIds].filter((id) => Boolean(state.blocks[id]))
    : Object.keys(state.blocks);
  if (ids.length === 0) return {};

  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  const undirected = new Map<string, Set<string>>();
  for (const id of ids) {
    outgoing.set(id, []);
    incoming.set(id, []);
    undirected.set(id, new Set<string>());
  }
  const active = new Set(ids);
  for (const link of Object.values(state.links)) {
    if (!active.has(link.sourceBlockId) || !active.has(link.targetBlockId)) continue;
    outgoing.get(link.sourceBlockId)?.push(link.targetBlockId);
    incoming.get(link.targetBlockId)?.push(link.sourceBlockId);
    undirected.get(link.sourceBlockId)?.add(link.targetBlockId);
    undirected.get(link.targetBlockId)?.add(link.sourceBlockId);
  }

  const components: string[][] = [];
  const seen = new Set<string>();
  const orderedIds = [...ids].sort((a, b) => sortByCurrentPosition(state, a, b));
  for (const start of orderedIds) {
    if (seen.has(start)) continue;
    const queue = [start];
    const group: string[] = [];
    seen.add(start);
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      group.push(current);
      const neighbors = [...(undirected.get(current) ?? [])].sort((a, b) =>
        sortByCurrentPosition(state, a, b),
      );
      for (const neighbor of neighbors) {
        if (seen.has(neighbor)) continue;
        seen.add(neighbor);
        queue.push(neighbor);
      }
    }
    components.push(group);
  }

  const NODE_WIDTH = 360;
  const COLUMN_GAP = 60;
  const ROW_GAP = 28;
  const COMPONENT_GAP = 140;
  const START_X = 80;
  let currentY = 80;

  const nextPositions: Record<string, { x: number; y: number }> = {};

  for (const component of components) {
    const componentSet = new Set(component);
    const depth = new Map<string, number>();
    const indegree = new Map<string, number>();

    for (const id of component) {
      const count = (incoming.get(id) ?? []).filter((src) => componentSet.has(src)).length;
      indegree.set(id, count);
    }

    const roots = component
      .filter((id) => (indegree.get(id) ?? 0) === 0)
      .sort((a, b) => sortByCurrentPosition(state, a, b));
    const queue = roots.length > 0 ? [...roots] : [...component].sort((a, b) => sortByCurrentPosition(state, a, b));
    for (const rootId of queue) depth.set(rootId, 0);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      const currentDepth = depth.get(current) ?? 0;
      const targets = (outgoing.get(current) ?? [])
        .filter((target) => componentSet.has(target))
        .sort((a, b) => sortByCurrentPosition(state, a, b));
      for (const target of targets) {
        const nextDepth = Math.max(depth.get(target) ?? 0, currentDepth + 1);
        const changed = nextDepth !== (depth.get(target) ?? 0);
        depth.set(target, nextDepth);
        if (changed || !queue.includes(target)) {
          queue.push(target);
        }
      }
    }

    for (const id of component) {
      if (!depth.has(id)) depth.set(id, 0);
    }

    const columns = new Map<number, string[]>();
    for (const id of component) {
      const col = depth.get(id) ?? 0;
      const list = columns.get(col) ?? [];
      list.push(id);
      columns.set(col, list);
    }

    let componentBottom = currentY;
    const orderedColumns = [...columns.keys()].sort((a, b) => a - b);
    for (const col of orderedColumns) {
      const colIds = columns.get(col) ?? [];
      colIds.sort((a, b) => sortByCurrentPosition(state, a, b));
      let yCursor = currentY;
      for (const id of colIds) {
        nextPositions[id] = {
          x: START_X + col * (NODE_WIDTH + COLUMN_GAP),
          y: yCursor,
        };
        const block = state.blocks[id];
        yCursor += estimateBlockHeight(block.data) + ROW_GAP;
      }
      if (yCursor > componentBottom) {
        componentBottom = yCursor;
      }
    }

    currentY = componentBottom + COMPONENT_GAP;
  }

  return nextPositions;
};

interface CopiedBlock {
  rootBlockId: string;
}

const isEditableTarget = (target: EventTarget | null): boolean => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.isContentEditable
  );
};

const Workspace = () => {
  const state = useBoardState();
  const dispatch = useBoardDispatch();

  const [collapsedBlockIds, setCollapsedBlockIds] = useState<Set<string>>(new Set());
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const copiedBlockRef = useRef<CopiedBlock | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const allBlocks = useMemo(() => Object.values(state.blocks), [state.blocks]);

  const selectedBlock = useMemo(
    () => (state.selectedBlockId ? state.blocks[state.selectedBlockId] ?? null : null),
    [state.blocks, state.selectedBlockId],
  );

  const searchResults = useMemo<SearchResult[]>(() => {
    return allBlocks
      .filter((block) => matchesSearchQuery(block.title, block.data, state.searchQuery))
      .map((block) => ({ id: block.id, title: block.title }));
  }, [allBlocks, state.searchQuery]);
  const headerSearchResults = useMemo(
    () => (state.searchQuery.trim() ? searchResults.slice(0, 12) : []),
    [searchResults, state.searchQuery],
  );

  const rootResults = useMemo<SearchResult[]>(() => {
    const targets = new Set(Object.values(state.links).map((link) => link.targetBlockId));
    return allBlocks
      .filter((block) => !targets.has(block.id))
      .map((block) => ({ id: block.id, title: block.title }));
  }, [allBlocks, state.links]);

  const createBlock = (title: string, data: JsonValue): void => {
    dispatch({
      type: 'createBlock',
      payload: {
        title: title.trim() || 'Untitled Block',
        data,
        position: nextBlockPosition(allBlocks.length),
      },
    });
  };

  const onCreate = (title: string, rawJson: string): string | null => {
    const parsed = parseJsonText(rawJson);
    if (parsed.error) return parsed.error.message;
    if (parsed.value === undefined) return 'JSON value is required.';
    const blockTitle = title.trim() || 'Untitled Block';
    const expanded = expandNestedJsonIntoLinkedBlocks(state, blockTitle, parsed.value);
    if (expanded) {
      dispatch({ type: 'importState', payload: { state: expanded } });
      return null;
    }
    createBlock(blockTitle, parsed.value);
    return null;
  };

  const onImport = (text: string): string | null => {
    const result = importBoardState(text);
    if (result.error || !result.state) {
      return result.error ?? 'Import failed.';
    }
    dispatch({ type: 'importState', payload: { state: result.state } });
    setCollapsedBlockIds(new Set());
    setSelectedLinkId(null);
    return null;
  };

  const onFormat = () => {
    const hidden = getHiddenDescendants(state, collapsedBlockIds);
    const visibleIds = new Set(Object.keys(state.blocks).filter((id) => !hidden.has(id)));
    const nextPositions = formatPositionsLeftToRight(state, visibleIds);
    Object.entries(nextPositions).forEach(([id, position]) => {
      dispatch({
        type: 'setBlockPosition',
        payload: {
          id,
          x: position.x,
          y: position.y,
        },
      });
    });
  };

  const expandCollapsedParents = (targetBlockId: string) => {
    setCollapsedBlockIds((prev) => {
      if (prev.size === 0) return prev;

      const incoming = new Map<string, string[]>();
      for (const link of Object.values(state.links)) {
        const next = incoming.get(link.targetBlockId) ?? [];
        next.push(link.sourceBlockId);
        incoming.set(link.targetBlockId, next);
      }

      const ancestors = new Set<string>();
      const seen = new Set<string>([targetBlockId]);
      const stack = [targetBlockId];
      while (stack.length > 0) {
        const current = stack.pop();
        if (!current) break;
        for (const parent of incoming.get(current) ?? []) {
          if (seen.has(parent)) continue;
          seen.add(parent);
          ancestors.add(parent);
          stack.push(parent);
        }
      }

      let changed = false;
      const next = new Set(prev);
      for (const ancestor of ancestors) {
        if (next.delete(ancestor)) changed = true;
      }
      return changed ? next : prev;
    });
  };

  const selectSearchResult = (id: string) => {
    expandCollapsedParents(id);
    dispatch({ type: 'selectBlock', payload: { id } });
    setSelectedLinkId(null);
    setIsSearchOpen(false);
  };

  useEffect(() => {
    setActiveSearchIndex(0);
  }, [state.searchQuery]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const blockIds = Object.keys(state.blocks);

      if (event.key === 'Tab' && blockIds.length > 0) {
        event.preventDefault();
        if (state.selectedBlockId) {
          const selected = state.blocks[state.selectedBlockId];
          if (selected) {
            dispatch({
              type: 'setBlockData',
              payload: {
                id: selected.id,
                data: addAttributeOnRootObject(selected.data),
              },
            });
          }
          return;
        }
        const ordered = [...blockIds].sort((a, b) => {
          const titleCompare = state.blocks[a].title.localeCompare(state.blocks[b].title);
          if (titleCompare !== 0) return titleCompare;
          return a.localeCompare(b);
        });
        const currentIndex = state.selectedBlockId ? ordered.indexOf(state.selectedBlockId) : -1;
        const nextIndex = currentIndex < 0
          ? 0
          : event.shiftKey
            ? (currentIndex - 1 + ordered.length) % ordered.length
            : (currentIndex + 1) % ordered.length;
        dispatch({ type: 'selectBlock', payload: { id: ordered[nextIndex] ?? null } });
        setSelectedLinkId(null);
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedLinkId) {
          dispatch({ type: 'deleteLink', payload: { id: selectedLinkId } });
          setSelectedLinkId(null);
          return;
        }
        if (state.selectedBlockId) {
          dispatch({ type: 'deleteBlock', payload: { id: state.selectedBlockId } });
          return;
        }
      }

      const isCopy = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c';
      if (isCopy && state.selectedBlockId) {
        const block = state.blocks[state.selectedBlockId];
        if (!block) return;
        copiedBlockRef.current = {
          rootBlockId: state.selectedBlockId,
        };
        event.preventDefault();
        const resolvedValue = resolveBlockValue(state, block.id);
        const clipboardText = JSON.stringify(resolvedValue ?? block.data, null, 2);
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          void navigator.clipboard.writeText(clipboardText).catch(() => {});
        }
        return;
      }

      const isPaste = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v';
      if (isPaste && copiedBlockRef.current) {
        event.preventDefault();
        dispatch({
          type: 'duplicateSubgraph',
          payload: {
            rootBlockId: copiedBlockRef.current.rootBlockId,
            offset: { x: 40, y: 40 },
          },
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch, selectedLinkId, state.blocks, state.positions, state.selectedBlockId]);

  return (
    <div className="workspace-shell">
      <header className="workspace-header">
        <div className="workspace-header-main">
          <Button asChild variant="outline">
            <Link to="/">Back Home</Link>
          </Button>
          <h1>PlayJSON Workspace</h1>
        </div>
        <div className="workspace-header-search">
          <div className="workspace-header-search-row">
            <Input
              role="combobox"
              aria-expanded={isSearchOpen && state.searchQuery.trim().length > 0}
              aria-controls="workspace-search-listbox"
              aria-autocomplete="list"
              aria-activedescendant={
                isSearchOpen && headerSearchResults[activeSearchIndex]
                  ? `workspace-search-option-${headerSearchResults[activeSearchIndex]?.id}`
                  : undefined
              }
              value={state.searchQuery}
              onChange={(event) => {
                dispatch({ type: 'setSearchQuery', payload: { query: event.target.value } });
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                if (state.searchQuery.trim()) setIsSearchOpen(true);
              }}
              onBlur={() => {
                window.setTimeout(() => setIsSearchOpen(false), 120);
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  if (headerSearchResults.length === 0) return;
                  setIsSearchOpen(true);
                  setActiveSearchIndex((prev) => (prev + 1) % headerSearchResults.length);
                  return;
                }
                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  if (headerSearchResults.length === 0) return;
                  setIsSearchOpen(true);
                  setActiveSearchIndex((prev) =>
                    (prev - 1 + headerSearchResults.length) % headerSearchResults.length,
                  );
                  return;
                }
                if (event.key === 'Escape') {
                  setIsSearchOpen(false);
                  return;
                }
                if (event.key !== 'Enter') return;
                const chosen =
                  isSearchOpen && headerSearchResults[activeSearchIndex]
                    ? headerSearchResults[activeSearchIndex]
                    : searchResults[0];
                if (!chosen) return;
                event.preventDefault();
                selectSearchResult(chosen.id);
              }}
              placeholder="Search blocks by title, key, value..."
            />
            {state.searchQuery.trim() ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dispatch({ type: 'setSearchQuery', payload: { query: '' } })}
              >
                Clear
              </Button>
            ) : null}
          </div>
          <div className="workspace-header-search-meta">
            {state.searchQuery.trim()
              ? `${searchResults.length} match${searchResults.length === 1 ? '' : 'es'} • Press Enter to jump to the first match`
              : 'Type to search blocks quickly'}
          </div>
          {state.searchQuery.trim() && isSearchOpen ? (
            <div id="workspace-search-listbox" role="listbox" className="workspace-header-search-results">
              {headerSearchResults.length > 0 ? (
                headerSearchResults.map((result, index) => (
                  <button
                    key={result.id}
                    id={`workspace-search-option-${result.id}`}
                    role="option"
                    aria-selected={index === activeSearchIndex}
                    className={`workspace-header-search-result ${index === activeSearchIndex ? 'is-active' : ''}`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => selectSearchResult(result.id)}
                  >
                    {result.title}
                  </button>
                ))
              ) : (
                <div className="hint">No matching blocks.</div>
              )}
            </div>
          ) : null}
        </div>
      </header>

      <div className="app-shell">
        <LeftPanel
          onCreate={onCreate}
          rootResults={rootResults}
          onSelectResult={(id) => {
            expandCollapsedParents(id);
            dispatch({ type: 'selectBlock', payload: { id } });
            setSelectedLinkId(null);
          }}
          onImport={onImport}
        />

        <ReactFlowProvider>
          <BoardCanvas
            state={state}
            collapsedBlockIds={collapsedBlockIds}
            selectedLinkId={selectedLinkId}
            onAddObjectBlock={() => createBlock('Object Block', {})}
            onAddArrayBlock={() => createBlock('Array Block', [])}
            onFormat={onFormat}
            onExport={() => downloadFile('playjson-board.json', exportState(state))}
            onResetBoard={() => {
              dispatch({ type: 'resetBoard' });
              setCollapsedBlockIds(new Set());
              setSelectedLinkId(null);
            }}
            onSelectBlock={(id) => dispatch({ type: 'selectBlock', payload: { id } })}
            onSelectLink={setSelectedLinkId}
            onToggleExpand={(id) => {
              setCollapsedBlockIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) {
                  next.delete(id);
                } else {
                  next.add(id);
                }
                return next;
              });
            }}
            onMoveBlock={(id, x, y) =>
              dispatch({
                type: 'setBlockPosition',
                payload: { id, x, y },
              })
            }
            onRenameAttrLinkKey={(blockId, oldKey, newKey) =>
              dispatch({
                type: 'renameAttrLinkKey',
                payload: { sourceBlockId: blockId, oldKey, newKey },
              })
            }
            onCreateAttrLink={(sourceBlockId, sourceAttrKey, targetBlockId) =>
              dispatch({
                type: 'upsertAttrLink',
                payload: { sourceBlockId, sourceAttrKey, targetBlockId },
              })
            }
            onRemoveAttrLink={(sourceBlockId, sourceAttrKey) =>
              dispatch({ type: 'removeAttrLink', payload: { sourceBlockId, sourceAttrKey } })
            }
            onDeleteLink={(id) => dispatch({ type: 'deleteLink', payload: { id } })}
            onUpdateData={(id, data) => dispatch({ type: 'setBlockData', payload: { id, data } })}
          />
        </ReactFlowProvider>

        <Card className="right-panel">
          <CardHeader>
            <CardTitle>Selected Block</CardTitle>
          </CardHeader>
          <CardContent>
          {!selectedBlock ? (
            <div className="hint">Select a block to edit.</div>
          ) : (
            <JsonEditor block={selectedBlock} allBlocks={allBlocks} links={Object.values(state.links)} />
          )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const WorkspacePage = () => (
  <BoardProvider initialState={loadState()}>
    <Workspace />
  </BoardProvider>
);

export const HomePage = () => (
  <div className="home-page">
    <header className="topbar">
      <div className="brand">PlayJSON</div>
    </header>

    <main>
      <section className="hero">
        <p className="eyebrow">Ship cleaner JSON models</p>
        <h1>Build, connect, and inspect JSON data without the chaos.</h1>
        <p className="lead">
          A focused workspace for technical teams who need fast structure editing, visual linking,
          and reliable exports.
        </p>
        <div className="hero-actions">
          <Link to="/workspace" className="nav-link-button">
            Open Workspace
          </Link>
        </div>
      </section>

      <section className="metrics" aria-label="Key metrics">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <h2>{metric.value}</h2>
            <p>{metric.label}</p>
          </article>
        ))}
      </section>

      <section className="features" id="features">
        {highlights.map((item) => (
          <article className="feature-card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>
    </main>
  </div>
);

function App() {
  return <HomePage />;
}

export default App;
