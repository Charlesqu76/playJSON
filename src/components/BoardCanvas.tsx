import { useCallback, useEffect, useMemo, useRef } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { BoardState, JsonValue } from '../types/model';
import { summarizeJson } from '../utils/json';
import BlockNode, { getAttrHandleId, type ActiveAttrDrag, type BlockNodeData } from './BlockNode';
import { Button } from './ui/button';

const nodeTypes = {
  blockNode: BlockNode,
};

interface BoardCanvasProps {
  state: BoardState;
  collapsedBlockIds: ReadonlySet<string>;
  selectedLinkId: string | null;
  onAddObjectBlock: () => void;
  onAddArrayBlock: () => void;
  onFormat: () => void;
  onExport: () => void;
  onResetBoard: () => void;
  onSelectBlock: (id: string | null) => void;
  onSelectLink: (id: string | null) => void;
  onToggleExpand: (id: string) => void;
  onMoveBlock: (id: string, x: number, y: number) => void;
  onRenameAttrLinkKey: (blockId: string, oldKey: string, newKey: string) => void;
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
  if (value === null) return 'null';
  if (Array.isArray(value)) return '[array]';
  if (typeof value === 'object') return '[object]';
  return String(value);
};

const BoardCanvas = ({
  state,
  collapsedBlockIds,
  selectedLinkId,
  onAddObjectBlock,
  onAddArrayBlock,
  onFormat,
  onExport,
  onResetBoard,
  onSelectBlock,
  onSelectLink,
  onToggleExpand,
  onMoveBlock,
  onRenameAttrLinkKey,
  onCreateAttrLink,
  onMoveAttrToBlock,
  onRemoveAttrLink,
  onDeleteLink,
  onUpdateData,
}: BoardCanvasProps) => {
  const { setCenter, fitView, zoomIn, zoomOut } = useReactFlow();
  const activeAttrDragRef = useRef<ActiveAttrDrag | null>(null);
  const clearDragTimerRef = useRef<number | null>(null);
  const allLinks = useMemo(() => Object.values(state.links), [state.links]);
  const onStartAttrDrag = useCallback(
    (mode: ActiveAttrDrag['mode'], sourceBlockId: string, sourceAttrKey: string) => {
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

  const hiddenBlockIds = useMemo(() => {
    if (collapsedBlockIds.size === 0) return new Set<string>();
    const outgoing = new Map<string, string[]>();
    for (const link of allLinks) {
      const next = outgoing.get(link.sourceBlockId) ?? [];
      next.push(link.targetBlockId);
      outgoing.set(link.sourceBlockId, next);
    }

    const hidden = new Set<string>();
    const seen = new Set<string>();
    const stack = Array.from(collapsedBlockIds);
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || seen.has(current)) continue;
      seen.add(current);
      for (const target of outgoing.get(current) ?? []) {
        if (hidden.has(target)) continue;
        hidden.add(target);
        stack.push(target);
      }
    }
    return hidden;
  }, [allLinks, collapsedBlockIds]);

  const visibleBlockIds = useMemo(
    () => Object.keys(state.blocks).filter((id) => !hiddenBlockIds.has(id)),
    [hiddenBlockIds, state.blocks],
  );

  const nodes = useMemo<Node[]>(() => {
    const outgoingCount = new Map<string, number>();
    const attrLinkByKey = new Map<string, BoardState['links'][string]>();
    for (const link of allLinks) {
      outgoingCount.set(link.sourceBlockId, (outgoingCount.get(link.sourceBlockId) ?? 0) + 1);
      if (link.sourceAttrKey) {
        attrLinkByKey.set(`${link.sourceBlockId}::${link.sourceAttrKey}`, link);
      }
    }

    return visibleBlockIds.map((id) => {
      const block = state.blocks[id];
      return {
      id: block.id,
      type: 'blockNode',
      position: state.positions[block.id] ?? { x: 100, y: 100 },
      data: {
        blockId: block.id,
        isSelected: state.selectedBlockId === block.id,
        isExpanded: !collapsedBlockIds.has(block.id),
        hasLinkedChildren: (outgoingCount.get(block.id) ?? 0) > 0,
        title: block.title,
        summary: summarizeJson(block.data),
        blockKind: Array.isArray(block.data)
          ? 'array'
          : block.data && typeof block.data === 'object'
            ? 'object'
            : 'other',
        attributes:
          block.data && typeof block.data === 'object' && !Array.isArray(block.data)
            ? Object.entries(block.data)
                .map(([key, value]) => {
                  const link = attrLinkByKey.get(`${block.id}::${key}`);
                  const targetTitle =
                    link && state.blocks[link.targetBlockId]
                      ? state.blocks[link.targetBlockId].title
                      : undefined;
                  return {
                    key,
                    valueText: toInlineValue(value),
                    isLinked: Boolean(link),
                    targetTitle,
                  };
                })
            : [],
        arrayValues: Array.isArray(block.data)
          ? block.data.map((value, index) => {
              const link = attrLinkByKey.get(`${block.id}::${index}`);
              const targetTitle =
                link && state.blocks[link.targetBlockId]
                  ? state.blocks[link.targetBlockId].title
                  : undefined;
              return {
                index,
                valueText: toInlineValue(value),
                isLinked: Boolean(link),
                targetTitle,
              };
            })
          : [],
        onRenameAttribute: (oldKey: string, newKey: string) => {
          const nextKey = newKey.trim();
          if (!nextKey) return 'Key cannot be empty.';
          if (!block.data || typeof block.data !== 'object' || Array.isArray(block.data)) {
            return 'Block root is not an object.';
          }
          const root = block.data as Record<string, JsonValue>;
          if (oldKey !== nextKey && Object.prototype.hasOwnProperty.call(root, nextKey)) {
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
          if (!block.data || typeof block.data !== 'object' || Array.isArray(block.data)) {
            return 'Block root is not an object.';
          }
          const root = block.data as Record<string, JsonValue>;
          if (!Object.prototype.hasOwnProperty.call(root, key)) {
            return `Attribute "${key}" not found.`;
          }
          onUpdateData(block.id, {
            ...root,
            [key]: rawValue,
          });
          onRemoveAttrLink(block.id, key);
          return null;
        },
        onCreateAttrLink,
        onMoveAttrToBlock,
        onStartAttrDrag,
        onEndAttrDrag,
        getActiveAttrDrag,
        onRemoveAttrLink,
        onToggleExpand,
      } satisfies BlockNodeData,
      selected: state.selectedBlockId === block.id,
    };
    });
  }, [
    allLinks,
    collapsedBlockIds,
    onCreateAttrLink,
    onMoveAttrToBlock,
    getActiveAttrDrag,
    onEndAttrDrag,
    onRemoveAttrLink,
    onRenameAttrLinkKey,
    onStartAttrDrag,
    onToggleExpand,
    onUpdateData,
    state.blocks,
    state.positions,
    state.selectedBlockId,
    visibleBlockIds,
  ]);

  const edges = useMemo<Edge[]>(() => {
    const visible = new Set(visibleBlockIds);
    return allLinks
      .filter((link) => visible.has(link.sourceBlockId) && visible.has(link.targetBlockId))
      .map((link) => ({
        id: link.id,
        source: link.sourceBlockId,
        sourceHandle: link.sourceAttrKey ? getAttrHandleId(link.sourceAttrKey) : 'block-source',
        target: link.targetBlockId,
        targetHandle: 'block-target',
        animated: false,
        selected: selectedLinkId === link.id,
      }));
  }, [allLinks, selectedLinkId, visibleBlockIds]);

  useEffect(() => {
    if (!state.selectedBlockId) return;
    const position = state.positions[state.selectedBlockId];
    if (!position) return;
    setCenter(position.x + 120, position.y + 40, { zoom: 1.2, duration: 250 });
  }, [setCenter, state.positions, state.selectedBlockId]);

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
    onFormat();
    requestAnimationFrame(() => {
      void fitView({
        padding: 0.18,
        duration: 260,
      });
    });
  };

  const onZoomIn = () => {
    void zoomIn({ duration: 180 });
  };

  const onZoomOut = () => {
    void zoomOut({ duration: 180 });
  };

  return (
    <div className="board-canvas">
      <div className="board-canvas-toolbar">
        <Button className="board-canvas-format-btn" size="sm" onClick={onAddObjectBlock}>
          Add Object
        </Button>
        <Button className="board-canvas-format-btn" size="sm" onClick={onAddArrayBlock}>
          Add Array
        </Button>
        <Button className="board-canvas-format-btn" size="sm" variant="secondary" onClick={onExport}>
          Export
        </Button>
        <Button className="board-canvas-format-btn" size="sm" variant="outline" onClick={onZoomOut}>
          Zoom Out
        </Button>
        <Button className="board-canvas-format-btn" size="sm" variant="outline" onClick={onZoomIn}>
          Zoom In
        </Button>
        <Button className="board-canvas-format-btn" size="sm" variant="secondary" onClick={onAutoFormat}>
          Auto-Format
        </Button>
        <Button className="board-canvas-format-btn" size="sm" variant="destructive" onClick={onResetBoard}>
          Reset Board
        </Button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
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
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default BoardCanvas;
