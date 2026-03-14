import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  applyNodeChanges,
  useReactFlow,
  type Edge,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { BoardState, JsonValue } from "../types/model";
import { summarizeJson } from "../utils/json";
import BlockNode, {
  getAttrHandleId,
  type ActiveAttrDrag,
  type BlockNodeData,
} from "./BlockNode";
import { Button } from "./ui/button";

const BackgroundView = Background as unknown as React.ComponentType;
const ControlsView = Controls as unknown as React.ComponentType;

const nodeTypes = {
  blockNode: BlockNode,
};

interface BoardCanvasProps {
  state: BoardState;
  collapsedAttrLinks: ReadonlySet<string>;
  collapsedBlockIds: ReadonlySet<string>;
  expandedArrayBlocks: ReadonlySet<string>;
  selectedLinkId: string | null;
  expandedNestedPaths: ReadonlySet<string>;
  onAddObjectBlock: () => void;
  onAddArrayBlock: () => void;
  onFormat: () => Promise<void> | void;
  onExport: () => void;
  onResetBoard: () => void;
  onSelectBlock: (id: string | null) => void;
  onSelectLink: (id: string | null) => void;
  onToggleBlockExpand: (blockId: string) => void;
  onToggleArrayExpand: (blockId: string) => void;
  onToggleAttrLinkCollapse: (blockId: string, attrKey: string) => void;
  onToggleNestedExpand: (blockId: string, path: string) => void;
  onMoveBlock: (id: string, x: number, y: number) => void;
  onRenameAttrLinkKey: (
    blockId: string,
    oldKey: string,
    newKey: string,
  ) => void;
  onCreateAttrLink: (
    sourceBlockId: string,
    sourceAttrKey: string,
    targetBlockId: string,
  ) => void;
  onMoveAttrToBlock: (
    sourceBlockId: string,
    sourceAttrKey: string,
    targetBlockId: string,
  ) => void;
  onRemoveAttrLink: (sourceBlockId: string, sourceAttrKey: string) => void;
  onDeleteLink: (id: string) => void;
  onUpdateData: (id: string, data: JsonValue) => void;
}

const toInlineValue = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.length}]`;
  if (typeof value === "object") return `{${Object.keys(value).length}}`;
  if (typeof value === "string") return `"${value}"`;
  return String(value);
};

const getNestedType = (value: unknown): "object" | "array" | "primitive" => {
  if (Array.isArray(value)) return "array";
  if (value && typeof value === "object") return "object";
  return "primitive";
};

const getNestedValueByPath = (data: JsonValue, path: string): JsonValue | undefined => {
  if (!path) return data;
  const parts = path.split(".");
  let current: JsonValue = data;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
    } else {
      current = (current as Record<string, JsonValue>)[part];
    }
  }
  return current;
};

const BoardCanvas = ({
  state,
  collapsedAttrLinks,
  collapsedBlockIds,
  expandedArrayBlocks,
  selectedLinkId,
  expandedNestedPaths,
  onAddObjectBlock,
  onAddArrayBlock,
  onFormat,
  onResetBoard,
  onSelectBlock,
  onSelectLink,
  onToggleBlockExpand,
  onToggleArrayExpand,
  onToggleAttrLinkCollapse,
  onToggleNestedExpand,
  onMoveBlock,
  onRenameAttrLinkKey,
  onCreateAttrLink,
  onMoveAttrToBlock,
  onRemoveAttrLink,
  onDeleteLink,
  onUpdateData,
}: BoardCanvasProps) => {
  const { setCenter, fitView, getZoom } = useReactFlow();
  const activeAttrDragRef = useRef<ActiveAttrDrag | null>(null);
  const clearDragTimerRef = useRef<number | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);
  const allLinks = useMemo(() => Object.values(state.links), [state.links]);
  const onStartAttrDrag = useCallback(
    (
      mode: ActiveAttrDrag["mode"],
      sourceBlockId: string,
      sourceAttrKey: string,
    ) => {
      if (clearDragTimerRef.current !== null) {
        window.clearTimeout(clearDragTimerRef.current);
        clearDragTimerRef.current = null;
      }
      activeAttrDragRef.current = { mode, sourceBlockId, sourceAttrKey };
    },
    [],
  );
  const onEndAttrDrag = useCallback(() => {
    if (clearDragTimerRef.current !== null) {
      window.clearTimeout(clearDragTimerRef.current);
    }
    clearDragTimerRef.current = window.setTimeout(() => {
      activeAttrDragRef.current = null;
      clearDragTimerRef.current = null;
    }, 60);
  }, []);
  const getActiveAttrDrag = useCallback(() => activeAttrDragRef.current, []);

  // Compute hidden blocks from collapsed attribute links and collapsed blocks
  const hiddenBlockIds = useMemo(() => {
    const hidden = new Set<string>();

    // Build outgoing links map
    const outgoing = new Map<string, string[]>();
    for (const link of allLinks) {
      const next = outgoing.get(link.sourceBlockId) ?? [];
      next.push(link.targetBlockId);
      outgoing.set(link.sourceBlockId, next);
    }

    const hideDescendants = (blockId: string) => {
      for (const child of outgoing.get(blockId) ?? []) {
        if (!hidden.has(child)) {
          hidden.add(child);
          hideDescendants(child);
        }
      }
    };

    // 1. Hide blocks from block-level collapse (collapsedBlockIds)
    for (const collapsedId of collapsedBlockIds) {
      hideDescendants(collapsedId);
    }

    // 2. Hide blocks from attribute-level collapse (collapsedAttrLinks)
    if (collapsedAttrLinks.size > 0) {
      const collapsedTargets = new Set<string>();
      for (const link of allLinks) {
        if (link.sourceAttrKey && collapsedAttrLinks.has(`${link.sourceBlockId}::${link.sourceAttrKey}`)) {
          collapsedTargets.add(link.targetBlockId);
        }
      }

      const nonCollapsedIncoming = new Map<string, number>();
      for (const link of allLinks) {
        const isCollapsed = link.sourceAttrKey && collapsedAttrLinks.has(`${link.sourceBlockId}::${link.sourceAttrKey}`);
        if (!isCollapsed) {
          nonCollapsedIncoming.set(link.targetBlockId, (nonCollapsedIncoming.get(link.targetBlockId) ?? 0) + 1);
        }
      }

      for (const targetId of collapsedTargets) {
        const visible = nonCollapsedIncoming.get(targetId) ?? 0;
        if (visible === 0 && !hidden.has(targetId)) {
          hidden.add(targetId);
          hideDescendants(targetId);
        }
      }
    }

    // 3. Hide array-linked blocks with index >= 2 (only show first 2)
    // Skip if the array block has been explicitly expanded
    for (const link of allLinks) {
      if (!link.sourceAttrKey) continue;
      const index = Number(link.sourceAttrKey);
      if (Number.isInteger(index) && index >= 2) {
        // Check if source block is an array and not expanded
        const sourceBlock = state.blocks[link.sourceBlockId];
        if (sourceBlock && Array.isArray(sourceBlock.data) && !expandedArrayBlocks.has(link.sourceBlockId)) {
          if (!hidden.has(link.targetBlockId)) {
            hidden.add(link.targetBlockId);
            hideDescendants(link.targetBlockId);
          }
        }
      }
    }

    return hidden;
  }, [allLinks, collapsedAttrLinks, collapsedBlockIds, expandedArrayBlocks, state.blocks]);

  const visibleBlockIds = useMemo(
    () => Object.keys(state.blocks).filter((id) => !hiddenBlockIds.has(id)),
    [hiddenBlockIds, state.blocks],
  );

  const nodes = useMemo<Node[]>(() => {
    const outgoingCount = new Map<string, number>();
    const attrLinkByKey = new Map<string, BoardState["links"][string]>();
    for (const link of allLinks) {
      outgoingCount.set(
        link.sourceBlockId,
        (outgoingCount.get(link.sourceBlockId) ?? 0) + 1,
      );
      if (link.sourceAttrKey) {
        attrLinkByKey.set(`${link.sourceBlockId}::${link.sourceAttrKey}`, link);
      }
    }

    return visibleBlockIds.map((id) => {
      const block = state.blocks[id];
      const blockExpandedPaths = new Set<string>();
      for (const key of expandedNestedPaths) {
        if (key.startsWith(`${block.id}::`)) {
          blockExpandedPaths.add(key.slice(block.id.length + 2));
        }
      }

      const hasLinkedChildren = (outgoingCount.get(block.id) ?? 0) > 0;

      // Check if this array block has hidden items (linked items with index >= 2)
      let hasHiddenArrayItems = false;
      let hiddenArrayItemCount = 0;
      if (Array.isArray(block.data)) {
        for (let i = 2; i < block.data.length; i++) {
          const link = attrLinkByKey.get(`${block.id}::${i}`);
          if (link) {
            hasHiddenArrayItems = true;
            hiddenArrayItemCount++;
          }
        }
      }
      const isExpandedArray = expandedArrayBlocks.has(block.id);

      return {
        id: block.id,
        type: "blockNode",
        position: state.positions[block.id] ?? { x: 100, y: 100 },
        data: {
          blockId: block.id,
          isSelected: state.selectedBlockId === block.id,
          isExpanded: !collapsedBlockIds.has(block.id),
          hasLinkedChildren,
          hasHiddenArrayItems,
          hiddenArrayItemCount,
          isExpandedArray,
          title: block.title,
          summary: summarizeJson(block.data),
          blockKind: Array.isArray(block.data)
            ? "array"
            : block.data && typeof block.data === "object"
              ? "object"
              : "other",
          expandedPaths: blockExpandedPaths,
          attributes:
            block.data &&
            typeof block.data === "object" &&
            !Array.isArray(block.data)
              ? Object.entries(block.data).map(([key, value]) => {
                  const link = attrLinkByKey.get(`${block.id}::${key}`);
                  const targetTitle =
                    link && state.blocks[link.targetBlockId]
                      ? state.blocks[link.targetBlockId].title
                      : undefined;
                  const nestedType = getNestedType(value);
                  const isExpandable = nestedType !== "primitive";
                  const isCollapsed = link ? collapsedAttrLinks.has(`${block.id}::${key}`) : false;
                  return {
                    key,
                    valueText: toInlineValue(value),
                    isExpandable,
                    isExpanded: blockExpandedPaths.has(key),
                    isLinked: Boolean(link),
                    isCollapsed,
                    targetTitle,
                    nestedType,
                    childCount: isExpandable
                      ? Array.isArray(value)
                        ? value.length
                        : Object.keys(value as Record<string, JsonValue>).length
                      : undefined,
                  };
                })
              : [],
          arrayValues: Array.isArray(block.data)
            ? block.data.map((value, index) => {
                const key = String(index);
                const link = attrLinkByKey.get(`${block.id}::${key}`);
                const targetTitle =
                  link && state.blocks[link.targetBlockId]
                    ? state.blocks[link.targetBlockId].title
                    : undefined;
                const nestedType = getNestedType(value);
                const isExpandable = nestedType !== "primitive";
                const isCollapsed = link ? collapsedAttrLinks.has(`${block.id}::${key}`) : false;
                return {
                  key,
                  valueText: toInlineValue(value),
                  isExpandable,
                  isExpanded: blockExpandedPaths.has(key),
                  isLinked: Boolean(link),
                  isCollapsed,
                  targetTitle,
                  nestedType,
                  childCount: isExpandable
                    ? Array.isArray(value)
                      ? value.length
                      : Object.keys(value as Record<string, JsonValue>).length
                    : undefined,
                };
              })
            : [],
          onRenameAttribute: (oldKey: string, newKey: string) => {
            const nextKey = newKey.trim();
            if (!nextKey) return "Key cannot be empty.";
            if (
              !block.data ||
              typeof block.data !== "object" ||
              Array.isArray(block.data)
            ) {
              return "Block root is not an object.";
            }
            const root = block.data as Record<string, JsonValue>;
            if (
              oldKey !== nextKey &&
              Object.prototype.hasOwnProperty.call(root, nextKey)
            ) {
              return `Key "${nextKey}" already exists.`;
            }
            const updated: Record<string, JsonValue> = {};
            for (const [key, value] of Object.entries(root)) {
              updated[key === oldKey ? nextKey : key] = value;
            }
            onRenameAttrLinkKey(block.id, oldKey, nextKey);
            onUpdateData(block.id, updated);
            return null;
          },
          onUpdateAttributeValue: (key: string, rawValue: string) => {
            if (
              !block.data ||
              typeof block.data !== "object" ||
              Array.isArray(block.data)
            ) {
              return "Block root is not an object.";
            }
            const root = block.data as Record<string, JsonValue>;
            if (!Object.prototype.hasOwnProperty.call(root, key)) {
              return `Attribute "${key}" not found.`;
            }
            onRemoveAttrLink(block.id, key);
            onUpdateData(block.id, {
              ...root,
              [key]: rawValue,
            });
            return null;
          },
          onCreateAttrLink,
          onMoveAttrToBlock,
          onStartAttrDrag,
          onEndAttrDrag,
          getActiveAttrDrag,
          onRemoveAttrLink,
          onToggleBlockExpand,
          onToggleArrayExpand,
          onToggleAttrLinkCollapse,
          onToggleNestedExpand,
          getNestedValue: (path: string) => getNestedValueByPath(block.data, path),
        } satisfies BlockNodeData,
        selected: state.selectedBlockId === block.id,
      };
    });
  }, [
    allLinks,
    collapsedAttrLinks,
    collapsedBlockIds,
    expandedArrayBlocks,
    expandedNestedPaths,
    onCreateAttrLink,
    onMoveAttrToBlock,
    getActiveAttrDrag,
    onEndAttrDrag,
    onRemoveAttrLink,
    onRenameAttrLinkKey,
    onStartAttrDrag,
    onToggleBlockExpand,
    onToggleArrayExpand,
    onToggleAttrLinkCollapse,
    onToggleNestedExpand,
    onUpdateData,
    state.blocks,
    state.positions,
    state.selectedBlockId,
    visibleBlockIds,
  ]);

  const edges = useMemo<Edge[]>(() => {
    const visible = new Set(visibleBlockIds);
    return allLinks
      .filter(
        (link) =>
          visible.has(link.sourceBlockId) && visible.has(link.targetBlockId),
      )
      .map((link) => ({
        id: link.id,
        source: link.sourceBlockId,
        sourceHandle: link.sourceAttrKey
          ? getAttrHandleId(link.sourceAttrKey)
          : "block-source",
        target: link.targetBlockId,
        targetHandle: "block-target",
        animated: false,
        selected: selectedLinkId === link.id,
      }));
  }, [allLinks, selectedLinkId, visibleBlockIds]);

  useEffect(() => {
    if (!state.selectedBlockId) return;
    const position = state.positions[state.selectedBlockId];
    if (!position) return;
    setCenter(position.x + 120, position.y + 40, {
      zoom: getZoom(),
      duration: 250,
    });
  }, [setCenter, getZoom, state.positions, state.selectedBlockId]);

  const onNodesChange = (changes: NodeChange<Node>[]) => {
    const updatedNodes = applyNodeChanges(changes, nodes);
    for (const node of updatedNodes) {
      const current = state.positions[node.id];
      if (!current) continue;
      if (current.x !== node.position.x || current.y !== node.position.y) {
        onMoveBlock(node.id, node.position.x, node.position.y);
      }
    }
  };

  const onAutoFormat = () => {
    void (async () => {
      setIsFormatting(true);
      try {
        await onFormat();
        requestAnimationFrame(() => {
          void fitView({
            padding: 0.18,
            duration: 260,
          });
        });
      } finally {
        setIsFormatting(false);
      }
    })();
  };

  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-[#d9d0c4] bg-white">
      <div className="absolute right-[0.6rem] top-[0.6rem] z-[6] flex flex-wrap justify-end gap-[0.45rem]">
        {/* <Button
          className="shadow-[0_1px_3px_rgba(15,23,42,0.16)]"
          size="sm"
          variant="secondary"
          onClick={onExport}
        >
          Export
        </Button> */}

        <Button
          className="shadow-[0_1px_3px_rgba(15,23,42,0.16)]"
          size="sm"
          variant="secondary"
          onClick={onAutoFormat}
          disabled={isFormatting}
        >
          {isFormatting && (
            <svg
              className="mr-1.5 h-3.5 w-3.5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          Auto-Format
        </Button>
        <Button
          className="shadow-[0_1px_3px_rgba(15,23,42,0.16)]"
          size="sm"
          onClick={onAddObjectBlock}
        >
          Add Object
        </Button>
        <Button
          className="shadow-[0_1px_3px_rgba(15,23,42,0.16)]"
          size="sm"
          onClick={onAddArrayBlock}
        >
          Add Array
        </Button>
        <Button
          className="shadow-[0_1px_3px_rgba(15,23,42,0.16)]"
          size="sm"
          variant="destructive"
          onClick={onResetBoard}
        >
          Reset Board
        </Button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onlyRenderVisibleElements
        onNodeClick={(_, node) => {
          onSelectBlock(node.id);
          onSelectLink(null);
        }}
        onEdgeClick={(_, edge) => {
          onSelectLink(edge.id);
        }}
        onPaneClick={() => {
          onSelectBlock(null);
          onSelectLink(null);
        }}
        onEdgesDelete={(deleted) => {
          for (const edge of deleted) {
            onDeleteLink(edge.id);
          }
          onSelectLink(null);
        }}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        minZoom={0.2}
        maxZoom={2.5}
        edgesReconnectable={false}
        fitView
        nodesConnectable={false}
        nodeTypes={nodeTypes}
      >
        <BackgroundView />
        <MiniMap />
        <ControlsView />
      </ReactFlow>
    </div>
  );
};

export default BoardCanvas;
