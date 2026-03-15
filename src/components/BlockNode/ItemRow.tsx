import { memo } from "react";
import { AttrDragMode } from "../../types/node";
import { NestedValue } from ".";
import { cn } from "../../lib/utils";
import { ATTR_MOVE_MIME, twoLineClampStyle } from "./const";
import CollapseButton from "./CollapseButton";
import LinkButton from "./LinkButton";
import { Handle, Position } from "@xyflow/react";
import { getAttrHandleId } from "./util";
const toDragPayload = (
  mode: AttrDragMode,
  sourceBlockId: string,
  sourceAttrKey: string,
): string => JSON.stringify({ mode, sourceBlockId, sourceAttrKey });

const ItemRow = memo(function ItemRow({
  item,
  blockId,
  showKey,
  isSelected,
  editingAttr,
  onSelect,
  onStartEdit,
  onUpdateDraft,
  onFinishEdit,
  onCancelEdit,
  onStartDrag,
  onEndDrag,
  onToggleCollapse,
  onRemoveLink,
}: {
  item: NestedValue;
  blockId: string;
  showKey: boolean;
  isSelected: boolean;
  editingAttr: { key: string; field: "key" | "value"; draft: string } | null;
  onSelect: () => void;
  onStartEdit: (field: "key" | "value") => void;
  onUpdateDraft: (draft: string) => void;
  onFinishEdit: (field: "key" | "value", draft: string) => void;
  onCancelEdit: () => void;
  onStartDrag: () => void;
  onEndDrag: () => void;
  onToggleCollapse: () => void;
  onRemoveLink: () => void;
}) {
  const isEditing = editingAttr?.key === item.key;

  return (
    <div
      className={cn(
        "nodrag nopan relative flex min-w-0 items-center gap-[0.2rem] border-b border-[#f1ebe1] px-[0.35rem] py-[0.2rem] font-mono text-[0.75rem]",
        isSelected && "bg-[#edf4ff]",
      )}
      draggable={!isEditing}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onClick={onSelect}
      onDragStart={(event) => {
        event.stopPropagation();
        if (isEditing) {
          event.preventDefault();
          return;
        }
        onSelect();
        onStartDrag();
        event.dataTransfer.effectAllowed = "move";
        const payload = toDragPayload("move", blockId, item.key);
        event.dataTransfer.setData(ATTR_MOVE_MIME, payload);
        event.dataTransfer.setData("text/plain", payload);
      }}
      onDragEnd={onEndDrag}
    >
      {showKey ? (
        <div className="min-w-0 flex flex-1 items-center gap-[0.15rem]">
          <span
            className="min-w-0 max-w-[45%] shrink cursor-pointer whitespace-normal rounded-xs hover:bg-[#f4f8ff]"
            style={twoLineClampStyle}
            onDoubleClick={() => onStartEdit("key")}
          >
            {editingAttr?.key === item.key && editingAttr.field === "key" ? (
              <input
                className="nodrag nopan w-30 rounded border border-[#d0c4b5] px-[0.2rem] py-[0.1rem] text-[0.72rem] focus:outline-none focus:ring-1 focus:ring-[#f3bc82]"
                value={editingAttr.draft}
                autoFocus
                onChange={(e) => onUpdateDraft(e.target.value)}
                onBlur={() => onFinishEdit("key", editingAttr.draft)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    onCancelEdit();
                    return;
                  }
                  if (e.key === "Enter") {
                    onFinishEdit("key", editingAttr.draft);
                  }
                }}
              />
            ) : (
              item.key
            )}
          </span>
          <span className="shrink-0">: </span>
          <span
            className="min-w-0 flex-1 cursor-pointer whitespace-normal rounded-xs hover:bg-[#f4f8ff]"
            style={twoLineClampStyle}
            onDoubleClick={() => onStartEdit("value")}
          >
            {editingAttr?.key === item.key && editingAttr.field === "value" ? (
              <input
                className="nodrag nopan w-30 rounded border border-[#d0c4b5] px-[0.2rem] py-[0.1rem] text-[0.72rem] focus:outline-none focus:ring-1 focus:ring-[#f3bc82]"
                value={editingAttr.draft}
                autoFocus
                onChange={(e) => onUpdateDraft(e.target.value)}
                onBlur={() => onFinishEdit("value", editingAttr.draft)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    onCancelEdit();
                    return;
                  }
                  if (e.key === "Enter") {
                    onFinishEdit("value", editingAttr.draft);
                  }
                }}
              />
            ) : (
              item.valueText
            )}
          </span>
        </div>
      ) : (
        <span
          className="min-w-0 flex-1 whitespace-normal"
          style={twoLineClampStyle}
        >
          {item.valueText}
        </span>
      )}
      <div className="mr-1 shrink-0 flex items-center gap-[0.15rem]">
        <CollapseButton
          isCollapsed={item.isCollapsed}
          isLinked={item.isLinked}
          onClick={onToggleCollapse}
        />
        <LinkButton
          isLinked={item.isLinked}
          targetTitle={item.targetTitle}
          onLinkDragStart={onStartDrag}
          onLinkDragEnd={onEndDrag}
          onUnlink={onRemoveLink}
        />
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id={getAttrHandleId(item.key)}
        className="pointer-events-none h-2.5! w-2.5! border-2! border-[#2563eb]! bg-white!"
      />
    </div>
  );
});

export default ItemRow;
