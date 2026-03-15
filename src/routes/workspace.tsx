import { useMemo, useRef, useState, useEffect } from "react";
import LeftPanel, { type SearchResult } from "../components/LeftPanel";
import MiddlePanel from "../components/MiddlePanel";
import { Input } from "../components/ui/input";
import { useBoardActions, useBoardState } from "../state/board";
import { exportState, importState as importBoardState } from "../state/storage";
import type { JsonValue } from "../types/model";
import { parseJsonText } from "../utils/json";
import { matchesSearchQuery } from "../utils/search";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { downloadFile, nextBlockPosition } from "../utils/dom-utils";
import { formatPositionsLeftToRightInWorker } from "../utils/layout-worker";
import { expandNestedJsonIntoLinkedBlocks } from "../utils/json-blocks";
import type { CopiedBlock } from "../utils/workspace-types";
import { createFileRoute } from "@tanstack/react-router";
import RightPanel from "../components/RightPanel";

export const Route = createFileRoute("/workspace")({
  component: RouteComponent,
});
const Workspace = () => {
  const state = useBoardState();
  const {
    createBlock: createBoardBlock,
    deleteBlock,
    deleteBlockPositions,
    deleteLink,
    duplicateSubgraph,
    importState,
    moveAttrToBlock,
    removeAttrLink,
    renameAttrLinkKey,
    resetBoard,
    selectBlock,
    setBlockData,
    setBlockPosition,
    setSearchQuery,
    upsertAttrLink,
  } = useBoardActions();

  const [collapsedAttrLinks, setCollapsedAttrLinks] = useState<Set<string>>(
    new Set(),
  );
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<Set<string>>(
    new Set(),
  );
  const [expandedArrayItems, setExpandedArrayItems] = useState<Set<string>>(
    new Set(),
  );
  // Track visible count per array block (default 5 items visible)
  const [arrayVisibleCount, setArrayVisibleCount] = useState<
    Map<string, number>
  >(new Map());
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const copiedBlockRef = useRef<CopiedBlock | null>(null);

  const allBlocks = useMemo(() => Object.values(state.blocks), [state.blocks]);

  const selectedBlock = useMemo(
    () => (state.selectedBlockId ? state.blocks[state.selectedBlockId] ?? null : null),
    [state.selectedBlockId, state.blocks],
  );

  const searchResults = useMemo<SearchResult[]>(() => {
    return allBlocks
      .filter((block) =>
        matchesSearchQuery(block.title, block.data, state.searchQuery),
      )
      .map((block) => ({ id: block.id, title: block.title }));
  }, [allBlocks, state.searchQuery]);

  const headerSearchResults = useMemo(
    () => (state.searchQuery.trim() ? searchResults.slice(0, 12) : []),
    [searchResults, state.searchQuery],
  );

  const rootResults = useMemo<SearchResult[]>(() => {
    const targets = new Set(
      Object.values(state.links).map((link) => link.targetBlockId),
    );
    return allBlocks
      .filter((block) => !targets.has(block.id))
      .map((block) => ({ id: block.id, title: block.title }));
  }, [allBlocks, state.links]);

  const createBlock = (title: string, data: JsonValue): void => {
    createBoardBlock({
      title: title.trim() || "Untitled Block",
      data,
      position: nextBlockPosition(allBlocks.length),
    });
  };

  const onCreate = (title: string, rawJson: string): string | null => {
    const parsed = parseJsonText(rawJson);
    if (parsed.error) return parsed.error.message;
    if (parsed.value === undefined) return "JSON value is required.";
    const blockTitle = title.trim() || "Untitled Block";
    const expanded = expandNestedJsonIntoLinkedBlocks(
      state,
      blockTitle,
      parsed.value,
      nextBlockPosition,
    );
    if (expanded) {
      importState(expanded);
      return null;
    }
    createBlock(blockTitle, parsed.value);
    return null;
  };

  const onImport = (text: string): string | null => {
    const result = importBoardState(text);
    if (result.error || !result.state) {
      return result.error ?? "Import failed.";
    }
    importState(result.state);
    setCollapsedAttrLinks(new Set());
    setSelectedLinkId(null);
    return null;
  };

  const onFormat = async (): Promise<void> => {
    const allLinks = Object.values(state.links);

    // Build outgoing links map
    const outgoing = new Map<string, string[]>();
    for (const link of allLinks) {
      const next = outgoing.get(link.sourceBlockId) ?? [];
      next.push(link.targetBlockId);
      outgoing.set(link.sourceBlockId, next);
    }

    const hideDescendants = (blockId: string, hidden: Set<string>) => {
      for (const child of outgoing.get(blockId) ?? []) {
        if (!hidden.has(child)) {
          hidden.add(child);
          hideDescendants(child, hidden);
        }
      }
    };

    const hiddenBlockIds = new Set<string>();

    // 1. Hide blocks from block-level collapse (collapsedBlockIds)
    for (const collapsedId of collapsedBlockIds) {
      hideDescendants(collapsedId, hiddenBlockIds);
    }

    // 2. Hide blocks from attribute-level collapse (collapsedAttrLinks)
    if (collapsedAttrLinks.size > 0) {
      const collapsedTargets = new Set<string>();
      for (const link of allLinks) {
        if (
          link.sourceAttrKey &&
          collapsedAttrLinks.has(`${link.sourceBlockId}::${link.sourceAttrKey}`)
        ) {
          collapsedTargets.add(link.targetBlockId);
        }
      }

      const nonCollapsedIncoming = new Map<string, number>();
      for (const link of allLinks) {
        const isCollapsed =
          link.sourceAttrKey &&
          collapsedAttrLinks.has(
            `${link.sourceBlockId}::${link.sourceAttrKey}`,
          );
        if (!isCollapsed) {
          nonCollapsedIncoming.set(
            link.targetBlockId,
            (nonCollapsedIncoming.get(link.targetBlockId) ?? 0) + 1,
          );
        }
      }

      for (const targetId of collapsedTargets) {
        const visible = nonCollapsedIncoming.get(targetId) ?? 0;
        if (visible === 0 && !hiddenBlockIds.has(targetId)) {
          hiddenBlockIds.add(targetId);
          hideDescendants(targetId, hiddenBlockIds);
        }
      }
    }

    // 3. Hide array-linked blocks based on visible count (default 5)
    const ARRAY_INITIAL_VISIBLE = 5;
    for (const link of allLinks) {
      if (!link.sourceAttrKey) continue;
      const index = Number(link.sourceAttrKey);
      const visibleCount =
        arrayVisibleCount.get(link.sourceBlockId) ?? ARRAY_INITIAL_VISIBLE;
      if (Number.isInteger(index) && index >= visibleCount) {
        const sourceBlock = state.blocks[link.sourceBlockId];
        if (sourceBlock && Array.isArray(sourceBlock.data)) {
          // Check if this specific item is individually expanded
          const itemKey = `${link.sourceBlockId}::${index}`;
          if (!expandedArrayItems.has(itemKey)) {
            if (!hiddenBlockIds.has(link.targetBlockId)) {
              hiddenBlockIds.add(link.targetBlockId);
              hideDescendants(link.targetBlockId, hiddenBlockIds);
            }
          }
        }
      }
    }

    const visibleIds = new Set(
      Object.keys(state.blocks).filter((id) => !hiddenBlockIds.has(id)),
    );
    const nextPositions = await formatPositionsLeftToRightInWorker(
      state,
      visibleIds,
      arrayVisibleCount,
    );
    Object.entries(nextPositions).forEach(([id, position]) => {
      setBlockPosition(id, position.x, position.y);
    });
    // Remove positions for hidden blocks so they don't occupy space
    if (hiddenBlockIds.size > 0) {
      deleteBlockPositions(hiddenBlockIds);
    }
  };

  const expandCollapsedParents = (targetBlockId: string) => {
    // Build incoming link map
    const incoming = new Map<
      string,
      Array<{ sourceBlockId: string; sourceAttrKey?: string }>
    >();
    for (const link of Object.values(state.links)) {
      const next = incoming.get(link.targetBlockId) ?? [];
      next.push({
        sourceBlockId: link.sourceBlockId,
        sourceAttrKey: link.sourceAttrKey,
      });
      incoming.set(link.targetBlockId, next);
    }

    // Find all ancestors
    const visited = new Set<string>();
    const arrayBlocksToExpand = new Set<string>();
    const arrayIndicesToExpand = new Set<string>();
    const stack = [targetBlockId];
    const ARRAY_INITIAL_VISIBLE = 5;
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || visited.has(current)) continue;
      visited.add(current);

      for (const { sourceBlockId, sourceAttrKey } of incoming.get(current) ??
        []) {
        if (!visited.has(sourceBlockId)) {
          stack.push(sourceBlockId);
        }
        // Check if this link comes from an array index >= visibleCount
        if (sourceAttrKey) {
          const index = Number(sourceAttrKey);
          const visibleCount =
            arrayVisibleCount.get(sourceBlockId) ?? ARRAY_INITIAL_VISIBLE;
          if (Number.isInteger(index) && index >= visibleCount) {
            const sourceBlock = state.blocks[sourceBlockId];
            if (sourceBlock && Array.isArray(sourceBlock.data)) {
              // Track this specific index to expand
              arrayIndicesToExpand.add(`${sourceBlockId}::${index}`);
              arrayBlocksToExpand.add(sourceBlockId);
            }
          }
        }
      }
    }

    // Expand collapsed blocks
    setCollapsedBlockIds((prev) => {
      if (prev.size === 0) return prev;
      let changed = false;
      const next = new Set(prev);
      for (const ancestor of visited) {
        if (next.delete(ancestor)) changed = true;
      }
      return changed ? next : prev;
    });

    // Expand collapsed attr links
    setCollapsedAttrLinks((prev) => {
      if (prev.size === 0) return prev;
      let changed = false;
      const next = new Set(prev);
      for (const link of Object.values(state.links)) {
        if (visited.has(link.targetBlockId) && link.sourceAttrKey) {
          const key = `${link.sourceBlockId}::${link.sourceAttrKey}`;
          if (next.delete(key)) changed = true;
        }
      }
      return changed ? next : prev;
    });

    // Expand array blocks to show hidden array items
    if (arrayIndicesToExpand.size > 0) {
      // Expand individual items
      setExpandedArrayItems((prev) => {
        const next = new Set(prev);
        for (const key of arrayIndicesToExpand) {
          next.add(key);
        }
        return next;
      });
    }
  };

  const selectSearchResult = (id: string) => {
    expandCollapsedParents(id);
    selectBlock(id);
    setSelectedLinkId(null);
    setIsSearchOpen(false);
  };

  useEffect(() => {
    setActiveSearchIndex(0);
  }, [state.searchQuery]);

  // Hook for keyboard shortcuts
  useKeyboardShortcuts({
    state,
    selectedLinkId,
    copiedBlockRef,
    actions: {
      deleteBlock,
      deleteLink,
      duplicateSubgraph,
      selectBlock,
      setBlockData,
    },
    setSelectedLinkId,
  });

  return (
    <div className="min-h-screen p-3  flex flex-col">
      <header className="mb-[0.7rem] grid grid-cols-[auto_minmax(320px,460px)] items-center gap-[0.85rem] max-[860px]:grid-cols-1">
        <a
          className="font-['Space_Grotesk','Avenir_Next','Segoe_UI',sans-serif] text-[1.15rem] font-bold tracking-[0.02em] text-[#2f2a25] no-underline"
          href="/"
        >
          PlayJSON
        </a>
        <div className="relative w-full">
          <div className="flex items-center">
            <Input
              id="workspace-search-input"
              role="combobox"
              aria-expanded={
                isSearchOpen && state.searchQuery.trim().length > 0
              }
              aria-controls="workspace-search-listbox"
              aria-autocomplete="list"
              aria-activedescendant={
                isSearchOpen && headerSearchResults[activeSearchIndex]
                  ? `workspace-search-option-${headerSearchResults[activeSearchIndex]?.id}`
                  : undefined
              }
              value={state.searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                if (state.searchQuery.trim()) setIsSearchOpen(true);
              }}
              onBlur={() => {
                window.setTimeout(() => setIsSearchOpen(false), 120);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  if (headerSearchResults.length === 0) return;
                  setIsSearchOpen(true);
                  setActiveSearchIndex(
                    (prev) => (prev + 1) % headerSearchResults.length,
                  );
                  return;
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  if (headerSearchResults.length === 0) return;
                  setIsSearchOpen(true);
                  setActiveSearchIndex(
                    (prev) =>
                      (prev - 1 + headerSearchResults.length) %
                      headerSearchResults.length,
                  );
                  return;
                }
                if (event.key === "Escape") {
                  setIsSearchOpen(false);
                  return;
                }
                if (event.key !== "Enter") return;
                const chosen =
                  isSearchOpen && headerSearchResults[activeSearchIndex]
                    ? headerSearchResults[activeSearchIndex]
                    : searchResults[0];
                if (!chosen) return;
                event.preventDefault();
                selectSearchResult(chosen.id);
              }}
              placeholder="Search title/key/value or JSONPath (e.g. $.profile.name, $..tags[*]=beta)"
            />
          </div>
          {state.searchQuery.trim() && isSearchOpen ? (
            <div
              id="workspace-search-listbox"
              role="listbox"
              className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-40 flex max-h-60 flex-col gap-[0.3rem] overflow-auto rounded-[10px] border border-[#e7dccd] bg-[rgba(255,255,255,0.95)] p-[0.35rem] shadow-[0_10px_26px_rgba(40,32,26,0.12)]"
            >
              {headerSearchResults.length > 0 ? (
                headerSearchResults.map((result, index) => (
                  <button
                    key={result.id}
                    id={`workspace-search-option-${result.id}`}
                    role="option"
                    aria-selected={index === activeSearchIndex}
                    className={`w-full cursor-pointer justify-start rounded-lg border px-[0.6rem] py-[0.45rem] text-left text-inherit ${
                      index === activeSearchIndex
                        ? "border-[#cdbdaa] bg-[#f3ede3] text-[#2f2a25]"
                        : "border-[#d9d0c4] bg-[#fffefb] text-[#2f2a25] hover:border-[#cdbdaa] hover:bg-[#f3ede3]"
                    }`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => selectSearchResult(result.id)}
                  >
                    {result.title}
                  </button>
                ))
              ) : (
                <div className="text-[0.9rem] text-[#6f655d]">
                  No matching blocks.
                </div>
              )}
            </div>
          ) : null}
        </div>
      </header>

      <div className="flex-1 flex flex-row gap-2 ">
        <LeftPanel
          onCreate={onCreate}
          rootResults={rootResults}
          onSelectResult={(id) => {
            expandCollapsedParents(id);
            selectBlock(id);
            setSelectedLinkId(null);
          }}
          onImport={onImport}
        />

        <MiddlePanel
          state={state}
          collapsedAttrLinks={collapsedAttrLinks}
          collapsedBlockIds={collapsedBlockIds}
          arrayVisibleCount={arrayVisibleCount}
          expandedArrayItems={expandedArrayItems}
          selectedLinkId={selectedLinkId}
          hasSelectedBlock={!!selectedBlock}
          showRightPanel={showRightPanel}
          onShowRightPanel={() => setShowRightPanel(true)}
          onHideRightPanel={() => setShowRightPanel(false)}
          onAddObjectBlock={() => createBlock("Object Block", {})}
          onAddArrayBlock={() => createBlock("Array Block", [])}
          onFormat={onFormat}
          onExport={() =>
            downloadFile("playjson-board.json", exportState(state))
          }
          onResetBoard={() => {
            resetBoard();
            setCollapsedAttrLinks(new Set());
            setCollapsedBlockIds(new Set());
            setArrayVisibleCount(new Map());
            setExpandedArrayItems(new Set());
            setSelectedLinkId(null);
          }}
          onSelectBlock={selectBlock}
          onSelectLink={setSelectedLinkId}
          onToggleBlockExpand={(id) => {
            // Find all linked attr keys for this block
            const linkedAttrKeys: string[] = [];
            for (const link of Object.values(state.links)) {
              if (link.sourceBlockId === id && link.sourceAttrKey) {
                linkedAttrKeys.push(link.sourceAttrKey);
              }
            }

            // Check if any are collapsed
            const anyCollapsed = linkedAttrKeys.some((key) =>
              collapsedAttrLinks.has(`${id}::${key}`),
            );

            setCollapsedAttrLinks((prev) => {
              const next = new Set(prev);
              if (anyCollapsed) {
                // Expand all - remove all from collapsed set
                for (const key of linkedAttrKeys) {
                  next.delete(`${id}::${key}`);
                }
              } else {
                // Collapse all - add all to collapsed set
                for (const key of linkedAttrKeys) {
                  next.add(`${id}::${key}`);
                }
              }
              return next;
            });
          }}
          onToggleArrayExpand={(blockId) => {
            // Show next 10 items
            setArrayVisibleCount((prev) => {
              const next = new Map(prev);
              const current = next.get(blockId) ?? 5;
              next.set(blockId, current + 10);
              return next;
            });
          }}
          onToggleArrayItemExpand={(blockId, index) => {
            setExpandedArrayItems((prev) => {
              const key = `${blockId}::${index}`;
              const next = new Set(prev);
              if (next.has(key)) {
                next.delete(key);
              } else {
                next.add(key);
              }
              return next;
            });
          }}
          onToggleAttrLinkCollapse={(blockId, attrKey) => {
            setCollapsedAttrLinks((prev) => {
              const key = `${blockId}::${attrKey}`;
              const next = new Set(prev);
              if (next.has(key)) {
                next.delete(key);
              } else {
                next.add(key);
              }
              return next;
            });
          }}
          onMoveBlock={setBlockPosition}
          onRenameAttrLinkKey={(blockId, oldKey, newKey) =>
            renameAttrLinkKey({ sourceBlockId: blockId, oldKey, newKey })
          }
          onCreateAttrLink={(sourceBlockId, sourceAttrKey, targetBlockId) =>
            upsertAttrLink({ sourceBlockId, sourceAttrKey, targetBlockId })
          }
          onMoveAttrToBlock={(sourceBlockId, sourceAttrKey, targetBlockId) =>
            moveAttrToBlock({ sourceBlockId, sourceAttrKey, targetBlockId })
          }
          onRemoveAttrLink={removeAttrLink}
          onDeleteLink={deleteLink}
          onUpdateData={setBlockData}
        />
      </div>
      {showRightPanel && (
        <RightPanel
          selectedBlock={selectedBlock}
          allBlocks={allBlocks}
          links={Object.values(state.links)}
          onClose={() => setShowRightPanel(false)}
        />
      )}
    </div>
  );
};

function RouteComponent() {
  return <Workspace />;
}
