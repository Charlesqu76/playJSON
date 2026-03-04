import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from '@tanstack/react-router';
import { ReactFlowProvider } from '@xyflow/react';
import * as dagre from 'dagre';
import { stratify, tree, type HierarchyPointNode } from 'd3-hierarchy';
import ELK, { type ElkExtendedEdge, type ElkNode } from 'elkjs/lib/elk.bundled.js';
import { v4 as uuidv4 } from 'uuid';
import BoardCanvas from '../components/BoardCanvas';
import JsonEditor from '../components/JsonEditor';
import LeftPanel, { type SearchResult } from '../components/LeftPanel';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { BoardProvider, useBoardDispatch, useBoardState } from '../state/board';
import {
  exportState,
  importState as importBoardState,
  loadState,
  saveState,
} from '../state/storage';
import type { BoardState, JsonObject, JsonValue } from '../types/model';
import { parseJsonText } from '../utils/json';
import { matchesSearchQuery } from '../utils/search';

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

const AUTO_FORMAT_VIRTUAL_ROOT_ID = '__auto_format_virtual_root__';
const elk = new ELK();
const RESIZE_HANDLE_WIDTH = 10;
const MIN_LEFT_PANEL_WIDTH = 260;
const MIN_CENTER_PANEL_WIDTH = 360;
const MIN_RIGHT_PANEL_WIDTH = 280;

type ResizeHandleTarget = 'left' | 'right';

interface ResizeDragState {
  target: ResizeHandleTarget;
  startX: number;
  startLeftWidth: number;
  startRightWidth: number;
  containerWidth: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const maxLeftPanelWidth = (containerWidth: number, rightPanelWidth: number): number =>
  Math.max(
    MIN_LEFT_PANEL_WIDTH,
    containerWidth - rightPanelWidth - MIN_CENTER_PANEL_WIDTH - RESIZE_HANDLE_WIDTH * 2,
  );

const maxRightPanelWidth = (containerWidth: number, leftPanelWidth: number): number =>
  Math.max(
    MIN_RIGHT_PANEL_WIDTH,
    containerWidth - leftPanelWidth - MIN_CENTER_PANEL_WIDTH - RESIZE_HANDLE_WIDTH * 2,
  );

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
    [key]: null,
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
  const titleA = state.blocks[a]?.title;
  const titleB = state.blocks[b]?.title;
  if (titleA && titleB) return titleA.localeCompare(titleB);
  if (titleA) return -1;
  if (titleB) return 1;
  return a.localeCompare(b);
};

const estimateBlockHeight = (data: JsonValue): number => {
  const BASE = 118;
  const ROW_HEIGHT = 24;
  const FOOTER = 24;

  if (Array.isArray(data)) {
    return BASE + data.length * ROW_HEIGHT + FOOTER;
  }
  if (isRootObject(data)) {
    return BASE + Object.keys(data).length * ROW_HEIGHT + FOOTER;
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

const formatPositionsLeftToRight = async (
  state: BoardState,
  targetBlockIds?: ReadonlySet<string>,
): Promise<Record<string, { x: number; y: number }>> => {
  const ids = targetBlockIds
    ? [...targetBlockIds].filter((id) => Boolean(state.blocks[id]))
    : Object.keys(state.blocks);
  if (ids.length === 0) return {};

  const NODE_WIDTH = 360;
  const COLUMN_GAP = 60;
  const ROW_GAP = 28;
  const START_X = 80;
  const START_Y = 80;

  const incoming = new Map<string, string[]>();
  for (const id of ids) {
    incoming.set(id, []);
  }
  const active = new Set(ids);
  const visibleLinks = Object.values(state.links).filter(
    (link) => active.has(link.sourceBlockId) && active.has(link.targetBlockId),
  );
  for (const link of visibleLinks) {
    incoming.get(link.targetBlockId)?.push(link.sourceBlockId);
  }

  let virtualRootId = AUTO_FORMAT_VIRTUAL_ROOT_ID;
  let suffix = 1;
  while (active.has(virtualRootId)) {
    virtualRootId = `${AUTO_FORMAT_VIRTUAL_ROOT_ID}_${suffix}`;
    suffix += 1;
  }

  interface HierarchyDatum {
    id: string;
    parentId: string | null;
  }

  const orderedIds = [...ids].sort((a, b) => sortByCurrentPosition(state, a, b));
  const hierarchyRows: HierarchyDatum[] = [{ id: virtualRootId, parentId: null }];
  for (const id of orderedIds) {
    const parents = [...(incoming.get(id) ?? [])].sort((a, b) => sortByCurrentPosition(state, a, b));
    hierarchyRows.push({
      id,
      parentId: parents[0] ?? virtualRootId,
    });
  }

  let hierarchyNodes: HierarchyPointNode<HierarchyDatum>[];
  try {
    const root = stratify<HierarchyDatum>()
      .id((datum) => datum.id)
      .parentId((datum) => datum.parentId)(hierarchyRows);
    hierarchyNodes = tree<HierarchyDatum>()
      .nodeSize([1, 1])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.25))(root)
      .descendants()
      .filter((node) => node.data.id !== virtualRootId);
  } catch {
    return {};
  }

  if (hierarchyNodes.length === 0) return {};

  const verticalOrder = new Map<string, number>();
  const depthById = new Map<string, number>();
  for (const node of hierarchyNodes) {
    verticalOrder.set(node.data.id, node.x);
    depthById.set(node.data.id, Math.max(0, node.depth - 1));
  }

  const columns = new Map<number, string[]>();
  for (const node of hierarchyNodes) {
    const depth = depthById.get(node.data.id) ?? 0;
    const list = columns.get(depth) ?? [];
    list.push(node.data.id);
    columns.set(depth, list);
  }

  const d3Positions: Record<string, { x: number; y: number }> = {};

  for (const depth of [...columns.keys()].sort((a, b) => a - b)) {
    const columnIds = (columns.get(depth) ?? []).sort((a, b) => {
      const verticalDelta = (verticalOrder.get(a) ?? 0) - (verticalOrder.get(b) ?? 0);
      if (verticalDelta !== 0) return verticalDelta;
      return sortByCurrentPosition(state, a, b);
    });
    let yCursor = START_Y;
    for (const id of columnIds) {
      const block = state.blocks[id];
      if (!block) continue;
      d3Positions[id] = {
        x: START_X + depth * (NODE_WIDTH + COLUMN_GAP),
        y: yCursor,
      };
      yCursor += estimateBlockHeight(block.data) + ROW_GAP;
    }
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setGraph({
    rankdir: 'LR',
    align: 'UL',
    marginx: START_X,
    marginy: START_Y,
    nodesep: ROW_GAP + 24,
    ranksep: COLUMN_GAP + 80,
    ranker: 'network-simplex',
  });
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  for (const id of orderedIds) {
    const block = state.blocks[id];
    if (!block) continue;
    dagreGraph.setNode(id, {
      width: NODE_WIDTH,
      height: estimateBlockHeight(block.data),
    });
  }

  for (const link of visibleLinks) {
    const sourceDepth = depthById.get(link.sourceBlockId) ?? 0;
    const targetDepth = depthById.get(link.targetBlockId) ?? sourceDepth + 1;
    dagreGraph.setEdge(link.sourceBlockId, link.targetBlockId, {
      minlen: Math.max(1, targetDepth - sourceDepth),
      weight: 2,
    });
  }

  for (const depth of [...columns.keys()].sort((a, b) => a - b)) {
    const orderedColumnIds = (columns.get(depth) ?? []).sort((a, b) => {
      const verticalDelta = (verticalOrder.get(a) ?? 0) - (verticalOrder.get(b) ?? 0);
      if (verticalDelta !== 0) return verticalDelta;
      return sortByCurrentPosition(state, a, b);
    });
    for (let index = 1; index < orderedColumnIds.length; index += 1) {
      const previous = orderedColumnIds[index - 1];
      const current = orderedColumnIds[index];
      if (!previous || !current) continue;
      dagreGraph.setEdge(previous, current, {
        minlen: 1,
        weight: 0.2,
      });
    }
  }

  dagre.layout(dagreGraph);

  const dagrePositions = new Map<string, { x: number; y: number }>();
  for (const id of orderedIds) {
    const block = state.blocks[id];
    if (!block) continue;
    const node = dagreGraph.node(id) as dagre.Node | undefined;
    if (!node || typeof node.x !== 'number' || typeof node.y !== 'number') continue;
    const width = typeof node.width === 'number' ? node.width : NODE_WIDTH;
    const height = typeof node.height === 'number' ? node.height : estimateBlockHeight(block.data);
    dagrePositions.set(id, {
      x: node.x - width / 2,
      y: node.y - height / 2,
    });
  }

  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': String(ROW_GAP + 20),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(COLUMN_GAP + 80),
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    },
    children: orderedIds.map((id) => {
      const block = state.blocks[id];
      const d3Position = d3Positions[id] ?? { x: START_X, y: START_Y };
      const dagrePosition = dagrePositions.get(id) ?? d3Position;
      return {
        id,
        width: NODE_WIDTH,
        height: estimateBlockHeight(block.data),
        x: dagrePosition.x,
        y: dagrePosition.y,
      };
    }),
    edges: visibleLinks.map(
      (link) =>
        ({
          id: link.id,
          sources: [link.sourceBlockId],
          targets: [link.targetBlockId],
        }) satisfies ElkExtendedEdge,
    ),
  };

  let elkPositions = new Map<string, { x: number; y: number }>();
  try {
    const elkResult = await elk.layout(elkGraph);
    elkPositions = new Map(
      (elkResult.children ?? [])
        .filter(
          (child): child is Required<Pick<ElkNode, 'id' | 'x' | 'y'>> =>
            typeof child.id === 'string' &&
            typeof child.x === 'number' &&
            typeof child.y === 'number',
        )
        .map((child) => [child.id, { x: child.x, y: child.y }]),
    );
  } catch {
    elkPositions = new Map();
  }

  const D3_WEIGHT = 0.15;
  const DAGRE_WEIGHT = 0.35;
  const ELK_WEIGHT = 0.5;
  const preferredPosition = new Map<string, { x: number; y: number }>();
  for (const id of orderedIds) {
    const d3Position = d3Positions[id] ?? { x: START_X, y: START_Y };
    const dagrePosition = dagrePositions.get(id) ?? d3Position;
    const elkPosition = elkPositions.get(id) ?? dagrePosition;
    preferredPosition.set(id, {
      x:
        d3Position.x * D3_WEIGHT +
        dagrePosition.x * DAGRE_WEIGHT +
        elkPosition.x * ELK_WEIGHT,
      y:
        d3Position.y * D3_WEIGHT +
        dagrePosition.y * DAGRE_WEIGHT +
        elkPosition.y * ELK_WEIGHT,
    });
  }

  const nodesByDepth = new Map<number, string[]>();
  for (const id of orderedIds) {
    const depth = depthById.get(id) ?? 0;
    const list = nodesByDepth.get(depth) ?? [];
    list.push(id);
    nodesByDepth.set(depth, list);
  }

  // Pack each depth column top-to-bottom to guarantee non-overlapping blocks.
  const nextPositions: Record<string, { x: number; y: number }> = {};
  for (const depth of [...nodesByDepth.keys()].sort((a, b) => a - b)) {
    const columnIds = (nodesByDepth.get(depth) ?? []).sort((a, b) => {
      const posA = preferredPosition.get(a)?.y ?? START_Y;
      const posB = preferredPosition.get(b)?.y ?? START_Y;
      if (posA !== posB) return posA - posB;
      return sortByCurrentPosition(state, a, b);
    });
    let yCursor = START_Y;
    for (const id of columnIds) {
      const block = state.blocks[id];
      if (!block) continue;
      const preferredY = preferredPosition.get(id)?.y ?? yCursor;
      const y = Math.max(preferredY, yCursor);
      nextPositions[id] = {
        x: START_X + depth * (NODE_WIDTH + COLUMN_GAP),
        y: Math.round(y),
      };
      yCursor = y + estimateBlockHeight(block.data) + ROW_GAP;
    }
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
  const appShellRef = useRef<HTMLDivElement | null>(null);
  const resizeDragStateRef = useRef<ResizeDragState | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [rightPanelWidth, setRightPanelWidth] = useState(390);

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

  const applyResizeDelta = useCallback(
    (
      target: ResizeHandleTarget,
      deltaX: number,
      baseline: { leftWidth: number; rightWidth: number; containerWidth: number },
    ) => {
      const { leftWidth, rightWidth, containerWidth } = baseline;
      if (containerWidth <= 0) return;

      if (target === 'left') {
        const next = Math.round(
          clamp(
            leftWidth + deltaX,
            MIN_LEFT_PANEL_WIDTH,
            maxLeftPanelWidth(containerWidth, rightWidth),
          ),
        );
        setLeftPanelWidth((prev) => (prev === next ? prev : next));
        return;
      }

      const next = Math.round(
        clamp(
          rightWidth - deltaX,
          MIN_RIGHT_PANEL_WIDTH,
          maxRightPanelWidth(containerWidth, leftWidth),
        ),
      );
      setRightPanelWidth((prev) => (prev === next ? prev : next));
    },
    [],
  );

  const stopResizing = useCallback(() => {
    if (!resizeDragStateRef.current) return;
    resizeDragStateRef.current = null;
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');
  }, []);

  const startResizing = useCallback(
    (target: ResizeHandleTarget, clientX: number) => {
      const containerWidth = appShellRef.current?.getBoundingClientRect().width ?? 0;
      if (containerWidth <= 0) return;
      resizeDragStateRef.current = {
        target,
        startX: clientX,
        startLeftWidth: leftPanelWidth,
        startRightWidth: rightPanelWidth,
        containerWidth,
      };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [leftPanelWidth, rightPanelWidth],
  );

  const resizeWithKeyboard = useCallback(
    (target: ResizeHandleTarget, deltaX: number) => {
      const containerWidth = appShellRef.current?.getBoundingClientRect().width ?? 0;
      if (containerWidth <= 0) return;
      applyResizeDelta(target, deltaX, {
        leftWidth: leftPanelWidth,
        rightWidth: rightPanelWidth,
        containerWidth,
      });
    },
    [applyResizeDelta, leftPanelWidth, rightPanelWidth],
  );

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const activeDrag = resizeDragStateRef.current;
      if (!activeDrag) return;
      applyResizeDelta(activeDrag.target, event.clientX - activeDrag.startX, {
        leftWidth: activeDrag.startLeftWidth,
        rightWidth: activeDrag.startRightWidth,
        containerWidth: activeDrag.containerWidth,
      });
    };

    const onPointerUp = () => {
      stopResizing();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      stopResizing();
    };
  }, [applyResizeDelta, stopResizing]);

  useEffect(() => {
    const element = appShellRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const containerWidth = entry.contentRect.width;
      const clampedLeft = Math.round(
        clamp(
          leftPanelWidth,
          MIN_LEFT_PANEL_WIDTH,
          maxLeftPanelWidth(containerWidth, rightPanelWidth),
        ),
      );
      const clampedRight = Math.round(
        clamp(
          rightPanelWidth,
          MIN_RIGHT_PANEL_WIDTH,
          maxRightPanelWidth(containerWidth, clampedLeft),
        ),
      );
      if (clampedLeft !== leftPanelWidth) {
        setLeftPanelWidth(clampedLeft);
      }
      if (clampedRight !== rightPanelWidth) {
        setRightPanelWidth(clampedRight);
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [leftPanelWidth, rightPanelWidth]);

  const appShellStyle = useMemo(
    () =>
      ({
        '--left-panel-width': `${leftPanelWidth}px`,
        '--right-panel-width': `${rightPanelWidth}px`,
      }) as CSSProperties,
    [leftPanelWidth, rightPanelWidth],
  );

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

  const onFormat = async (): Promise<void> => {
    const hidden = getHiddenDescendants(state, collapsedBlockIds);
    const visibleIds = new Set(Object.keys(state.blocks).filter((id) => !hidden.has(id)));
    const nextPositions = await formatPositionsLeftToRight(state, visibleIds);
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
        <Link className="workspace-logo" to="/">
          PlayJSON
        </Link>
        <div className="workspace-header-search">
          <div className="workspace-header-search-row">
            <Input
              id="workspace-search-input"
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

      <div className="app-shell" ref={appShellRef} style={appShellStyle}>
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

        <div
          className="workspace-resize-handle"
          role="separator"
          tabIndex={0}
          aria-label="Resize left and center panels"
          aria-orientation="vertical"
          onPointerDown={(event) => {
            event.preventDefault();
            startResizing('left', event.clientX);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              resizeWithKeyboard('left', -20);
              return;
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              resizeWithKeyboard('left', 20);
            }
          }}
        />

        <div className="workspace-center-panel">
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
              onMoveAttrToBlock={(sourceBlockId, sourceAttrKey, targetBlockId) =>
                dispatch({
                  type: 'moveAttrToBlock',
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
        </div>

        <div
          className="workspace-resize-handle"
          role="separator"
          tabIndex={0}
          aria-label="Resize center and right panels"
          aria-orientation="vertical"
          onPointerDown={(event) => {
            event.preventDefault();
            startResizing('right', event.clientX);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              resizeWithKeyboard('right', -20);
              return;
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              resizeWithKeyboard('right', 20);
            }
          }}
        />

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

export default WorkspacePage;
