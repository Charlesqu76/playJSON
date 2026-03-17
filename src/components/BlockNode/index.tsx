import { useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Eye, EyeOff, Settings } from "lucide-react";
import { cn } from "../../lib/utils";
import { ActiveAttrDrag, AttrDragMode } from "../../types/node";
import {
  ATTR_LINK_MIME,
  ATTR_MOVE_MIME,
  twoLineClampStyle,
} from "./const";
import ItemRow from "./ItemRow";

export interface NestedValue {
  key: string;
  valueText: string;
  rawValue: unknown;
  isLinked: boolean;
  isCollapsed: boolean;
  isHiddenByArrayTruncation?: boolean;
  targetTitle?: string;
}

export interface BlockNodeData {
  blockId: string;
  isSelected: boolean;
  isExpanded: boolean;
  hasLinkedChildren: boolean;
  title: string;
  summary: string;
  blockKind: "object" | "array" | "other";
  attributes: NestedValue[];
  arrayValues: NestedValue[];
  onRenameAttribute: (oldKey: string, newKey: string) => string | null;
  onUpdateAttributeValue: (key: string, rawValue: string) => string | null;
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
  onStartAttrDrag: (
    mode: AttrDragMode,
    sourceBlockId: string,
    sourceAttrKey: string,
  ) => void;
  onEndAttrDrag: () => void;
  getActiveAttrDrag: () => ActiveAttrDrag | null;
  onRemoveAttrLink: (sourceBlockId: string, sourceAttrKey: string) => void;
  onToggleBlockExpand: (blockId: string) => void;
  onToggleArrayExpand: (blockId: string) => void;
  onToggleArrayItemExpand: (blockId: string, index: number) => void;
  onToggleAttrLinkCollapse: (blockId: string, attrKey: string) => void;
  onShowRightPanel: () => void;
}

const parseAttrDragPayload = (raw: string): ActiveAttrDrag | null => {
  try {
    const parsed = JSON.parse(raw) as {
      mode?: unknown;
      sourceBlockId?: unknown;
      sourceAttrKey?: unknown;
    };
    if (
      typeof parsed.sourceBlockId !== "string" ||
      typeof parsed.sourceAttrKey !== "string"
    ) {
      return null;
    }
    const mode: AttrDragMode = parsed.mode === "move" ? "move" : "link";
    return {
      mode,
      sourceBlockId: parsed.sourceBlockId,
      sourceAttrKey: parsed.sourceAttrKey,
    };
  } catch {
    return null;
  }
};

const BlockNode = ({ data }: NodeProps) => {
  const nodeData = data as unknown as BlockNodeData;
  const [error, setError] = useState<string | null>(null);
  const [selectedAttrId, setSelectedAttrId] = useState<string | null>(null);
  const [editingAttr, setEditingAttr] = useState<{
    key: string;
    field: "key" | "value";
    draft: string;
  } | null>(null);

  const handleFinishEdit = (
    attrKey: string,
    field: "key" | "value",
    draft: string,
  ) => {
    if (field === "key") {
      const result = nodeData.onRenameAttribute(attrKey, draft);
      if (result) {
        setError(result);
        return;
      }
    } else {
      const result = nodeData.onUpdateAttributeValue(attrKey, draft);
      if (result) {
        setError(result);
        return;
      }
    }
    setError(null);
    setEditingAttr(null);
  };

  // Combine array and object items, filter out hidden array items
  const items: NestedValue[] = (
    nodeData.blockKind === "array" ? nodeData.arrayValues : nodeData.attributes
  ).filter((item) => !item.isHiddenByArrayTruncation);

  // Count hidden items for display
  const hiddenCount = nodeData.blockKind === "array"
    ? nodeData.arrayValues.filter((item) => item.isHiddenByArrayTruncation).length
    : 0;

  return (
    <div
      className={cn(
        "max-w-[320px] min-w-42.5 overflow-hidden rounded-xl border p-2 transition-[box-shadow,border-color,background] duration-100",
        nodeData.blockKind === "object" && "border-[#d7b691] bg-[#fff8ee]",
        nodeData.blockKind === "array" && "border-[#9fc3de] bg-[#edf7ff]",
        nodeData.blockKind === "other" && "border-[#c6c6c6] bg-[#f7f7f7]",
        nodeData.isSelected &&
          "border-[#2563eb] shadow-[0_0_0_2px_rgba(37,99,235,0.2)]",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();

        const movePayload = parseAttrDragPayload(
          event.dataTransfer.getData(ATTR_MOVE_MIME),
        );
        const linkPayload = parseAttrDragPayload(
          event.dataTransfer.getData(ATTR_LINK_MIME),
        );
        const textPayload = parseAttrDragPayload(
          event.dataTransfer.getData("text/plain"),
        );
        const payload =
          movePayload ??
          linkPayload ??
          nodeData.getActiveAttrDrag() ??
          textPayload;

        if (!payload) return;

        if (payload.mode === "move") {
          nodeData.onMoveAttrToBlock(
            payload.sourceBlockId,
            payload.sourceAttrKey,
            nodeData.blockId,
          );
        } else {
          nodeData.onCreateAttrLink(
            payload.sourceBlockId,
            payload.sourceAttrKey,
            nodeData.blockId,
          );
        }
        nodeData.onEndAttrDrag();
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="block-target"
        className="pointer-events-none -left-1.75! h-2.5! w-2.5! border-2! border-[#2563eb]! bg-white!"
      />
      <div className="flex min-w-0 items-center justify-between gap-[0.45rem]">
        <div
          className="min-w-0 flex-1 whitespace-normal font-bold"
          style={twoLineClampStyle}
        >
          {nodeData.title}
        </div>
        <div className="flex min-w-0 shrink-0 items-center gap-1">
          {nodeData.hasLinkedChildren && (
            <button
              className="nodrag nopan shrink-0 rounded-md border border-[#d9d0c4] bg-[#fffefb] p-1 hover:bg-[#f3ede3]"
              onClick={() => {
                nodeData.onToggleBlockExpand(nodeData.blockId);
                setEditingAttr(null);
              }}
              title={nodeData.isExpanded ? "Hide all" : "Show all"}
            >
              {nodeData.isExpanded ? (
                <EyeOff className="h-3.5 w-3.5 text-[#6b6b6b]" />
              ) : (
                <Eye className="h-3.5 w-3.5 text-[#6b6b6b]" />
              )}
            </button>
          )}
          <button
            className="nodrag nopan shrink-0 rounded-md border border-[#d9d0c4] bg-[#fffefb] p-1 hover:bg-[#f3ede3]"
            title="Show details"
            onClick={nodeData.onShowRightPanel}
          >
            <Settings className="h-3.5 w-3.5 text-[#6b6b6b]" />
          </button>
        </div>
      </div>
      <div
        className="mb-[0.45rem] mt-[0.2rem] whitespace-normal text-[0.85rem] text-[#61564f]"
        style={twoLineClampStyle}
      >
        {nodeData.summary}
      </div>

      {items.length > 0 ? (
        <div className="mb-[0.3rem] rounded-lg border border-[#e9dfd1] bg-white overflow-hidden">
          {items.map((item) => {
            const attrId = `${nodeData.blockKind}:${item.key}`;

            return (
              <ItemRow
                key={`${nodeData.blockId}-${nodeData.blockKind}-${item.key}`}
                item={item}
                blockId={nodeData.blockId}
                showKey={nodeData.blockKind === "object"}
                isSelected={selectedAttrId === attrId}
                editingAttr={editingAttr}
                onSelect={() => setSelectedAttrId(attrId)}
                onStartEdit={(field) =>
                  setEditingAttr({
                    key: item.key,
                    field,
                    draft: field === "key" ? item.key : item.valueText,
                  })
                }
                onUpdateDraft={(draft) =>
                  setEditingAttr((prev) => (prev ? { ...prev, draft } : prev))
                }
                onFinishEdit={(field, draft) =>
                  handleFinishEdit(item.key, field, draft)
                }
                onCancelEdit={() => setEditingAttr(null)}
                onStartDrag={() =>
                  nodeData.onStartAttrDrag("move", nodeData.blockId, item.key)
                }
                onStartLinkDrag={() =>
                  nodeData.onStartAttrDrag("link", nodeData.blockId, item.key)
                }
                onEndDrag={() => nodeData.onEndAttrDrag()}
                onToggleCollapse={() => {
                  if (item.isHiddenByArrayTruncation) {
                    nodeData.onToggleArrayItemExpand(
                      nodeData.blockId,
                      Number(item.key),
                    );
                  } else {
                    nodeData.onToggleAttrLinkCollapse(
                      nodeData.blockId,
                      item.key,
                    );
                  }
                }}
                onRemoveLink={() =>
                  nodeData.onRemoveAttrLink(nodeData.blockId, item.key)
                }
              />
            );
          })}
          {nodeData.blockKind === "array" &&
            hiddenCount > 0 && (
              <button
                className="nodrag nopan w-full border-b border-[#f1ebe1] px-[0.35rem] py-[0.2rem] text-left font-mono text-[0.72rem] text-[#2563eb] hover:bg-[#f4f8ff]"
                onClick={() => nodeData.onToggleArrayExpand(nodeData.blockId)}
              >
                + Show next 10 items
              </button>
            )}
        </div>
      ) : null}

      {error ? (
        <div className="mb-[0.55rem] rounded-lg border border-[#fecaca] bg-[#fee2e2] px-[0.45rem] py-[0.35rem] text-[0.9rem] text-[#b91c1c]">
          {error}
        </div>
      ) : null}
    </div>
  );
};

export default BlockNode;
