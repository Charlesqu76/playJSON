import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import LeftPanel, { type SearchResult } from "../components/LeftPanel";
import MiddlePanel from "../components/MiddlePanel";
import RightPanel from "../components/RightPanel";
import { Input } from "../components/ui/input";
import {
  initializeBoardStore,
  useBoardActions,
  useBoardState,
} from "../state/board";
import {
  exportState,
  importState as importBoardState,
  loadState,
  saveState,
} from "../state/storage";
import type { JsonValue } from "../types/model";
import { parseJsonText } from "../utils/json";
import { matchesSearchQuery } from "../utils/search";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { downloadFile, nextBlockPosition } from "../utils/dom-utils";
import { formatPositionsLeftToRight } from "../utils/layout-algorithms";
import { getHiddenDescendants } from "../utils/block-utils";
import { expandNestedJsonIntoLinkedBlocks } from "../utils/json-blocks";
import {
  clamp,
  maxLeftPanelWidth,
  maxRightPanelWidth,
} from "../utils/resize-utils";
import {
  MIN_LEFT_PANEL_WIDTH,
  MIN_RIGHT_PANEL_WIDTH,
} from "../utils/workspace-constants";
import type {
  ResizeHandleTarget,
  CopiedBlock,
  ResizeDragState,
} from "../utils/workspace-types";

const Workspace = () => {
  const state = useBoardState();
  const {
    createBlock: createBoardBlock,
    deleteBlock,
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

  const [collapsedBlockIds, setCollapsedBlockIds] = useState<Set<string>>(
    new Set(),
  );
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
    () =>
      state.selectedBlockId
        ? (state.blocks[state.selectedBlockId] ?? null)
        : null,
    [state.blocks, state.selectedBlockId],
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

  const applyResizeDelta = useCallback(
    (
      target: ResizeHandleTarget,
      deltaX: number,
      baseline: {
        leftWidth: number;
        rightWidth: number;
        containerWidth: number;
      },
    ) => {
      const { leftWidth, rightWidth, containerWidth } = baseline;
      if (containerWidth <= 0) return;

      if (target === "left") {
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
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
  }, []);

  const startResizing = useCallback(
    (target: ResizeHandleTarget, clientX: number) => {
      const containerWidth =
        appShellRef.current?.getBoundingClientRect().width ?? 0;
      if (containerWidth <= 0) return;
      resizeDragStateRef.current = {
        target,
        startX: clientX,
        startLeftWidth: leftPanelWidth,
        startRightWidth: rightPanelWidth,
        containerWidth,
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [leftPanelWidth, rightPanelWidth],
  );

  const resizeWithKeyboard = useCallback(
    (target: ResizeHandleTarget, deltaX: number) => {
      const containerWidth =
        appShellRef.current?.getBoundingClientRect().width ?? 0;
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

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      stopResizing();
    };
  }, [applyResizeDelta, stopResizing]);

  useEffect(() => {
    const element = appShellRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

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
        "--left-panel-width": `${leftPanelWidth}px`,
        "--right-panel-width": `${rightPanelWidth}px`,
      }) as CSSProperties,
    [leftPanelWidth, rightPanelWidth],
  );

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
    setCollapsedBlockIds(new Set());
    setSelectedLinkId(null);
    return null;
  };

  const onFormat = async (): Promise<void> => {
    const hidden = getHiddenDescendants(state, collapsedBlockIds);
    const visibleIds = new Set(
      Object.keys(state.blocks).filter((id) => !hidden.has(id)),
    );
    const nextPositions = await formatPositionsLeftToRight(state, visibleIds);
    Object.entries(nextPositions).forEach(([id, position]) => {
      setBlockPosition(id, position.x, position.y);
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
    <div className="min-h-screen p-3">
      <header className="mb-[0.7rem] grid grid-cols-[auto_minmax(320px,460px)] items-center gap-[0.85rem] max-[860px]:grid-cols-1">
        <a
          className="[font-family:'Space_Grotesk','Avenir_Next','Segoe_UI',sans-serif] text-[1.15rem] font-bold tracking-[0.02em] text-[#2f2a25] no-underline"
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

      <div
        className="grid h-[calc(100vh-84px)] items-stretch gap-0 [grid-template-columns:var(--left-panel-width)_10px_minmax(0,1fr)_10px_var(--right-panel-width)] max-[1280px]:h-auto max-[1280px]:grid-cols-1"
        ref={appShellRef}
        style={appShellStyle}
      >
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

        <div
          className="relative m-0 w-full cursor-col-resize border-0 bg-transparent p-0 touch-none transition-colors duration-100 hover:bg-[rgba(184,171,152,0.22)] focus-visible:bg-[rgba(184,171,152,0.22)] max-[1280px]:hidden"
          role="separator"
          tabIndex={0}
          aria-label="Resize left and center panels"
          aria-orientation="vertical"
          onPointerDown={(event) => {
            event.preventDefault();
            startResizing("left", event.clientX);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              resizeWithKeyboard("left", -20);
              return;
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              resizeWithKeyboard("left", 20);
            }
          }}
        />

        <MiddlePanel
          state={state}
          collapsedBlockIds={collapsedBlockIds}
          selectedLinkId={selectedLinkId}
          onAddObjectBlock={() => createBlock("Object Block", {})}
          onAddArrayBlock={() => createBlock("Array Block", [])}
          onFormat={onFormat}
          onExport={() =>
            downloadFile("playjson-board.json", exportState(state))
          }
          onResetBoard={() => {
            resetBoard();
            setCollapsedBlockIds(new Set());
            setSelectedLinkId(null);
          }}
          onSelectBlock={selectBlock}
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

        <div
          className="relative m-0 w-full cursor-col-resize border-0 bg-transparent p-0 touch-none transition-colors duration-100 hover:bg-[rgba(184,171,152,0.22)] focus-visible:bg-[rgba(184,171,152,0.22)] max-[1280px]:hidden"
          role="separator"
          tabIndex={0}
          aria-label="Resize center and right panels"
          aria-orientation="vertical"
          onPointerDown={(event) => {
            event.preventDefault();
            startResizing("right", event.clientX);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              resizeWithKeyboard("right", -20);
              return;
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              resizeWithKeyboard("right", 20);
            }
          }}
        />

        <RightPanel
          selectedBlock={selectedBlock}
          allBlocks={allBlocks}
          links={Object.values(state.links)}
        />
      </div>
    </div>
  );
};

export const WorkspacePage = () => {
  const hasInitializedStoreRef = useRef(false);

  if (!hasInitializedStoreRef.current) {
    initializeBoardStore(loadState());
    hasInitializedStoreRef.current = true;
  }

  return <Workspace />;
};

export default WorkspacePage;
