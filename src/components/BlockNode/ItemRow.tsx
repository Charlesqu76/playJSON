import { memo } from "react";
import { AttrDragMode } from "../../types/node";
import { NestedValue } from ".";
import { cn } from "../../lib/utils";
import { ATTR_MOVE_MIME, twoLineClampStyle, getValueColor } from "./const";
import CollapseButton from "./CollapseButton";
import LinkButton from "./LinkButton";
import { Handle, Position } from "@xyflow/react";
import { getAttrHandleId } from "./util";
import { Link } from "lucide-react";
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
  onStartLinkDrag,
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
  onStartLinkDrag: () => void;
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
        // Check if drag started from LinkButton - if so, let LinkButton handle it
        const target = event.target as HTMLElement;
        if (target.closest("[data-link-button]")) {
          return;
        }
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
            style={{
              ...twoLineClampStyle,
              color: getValueColor(item.rawValue),
            }}
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
          style={{ ...twoLineClampStyle, color: getValueColor(item.rawValue) }}
        >
          {item.valueText}
        </span>
      )}
      <div className="mr-1 shrink-0 flex items-center gap-[0.15rem] relative">
        <CollapseButton
          isCollapsed={item.isCollapsed}
          isLinked={item.isLinked}
          onClick={onToggleCollapse}
        />
        <LinkButton
          id={getAttrHandleId(item.key)}
          isLinked={item.isLinked}
          targetTitle={item.targetTitle}
          blockId={blockId}
          attrKey={item.key}
          onLinkDragStart={onStartLinkDrag}
          onLinkDragEnd={onEndDrag}
          onUnlink={onRemoveLink}
        />
      </div>
    </div>
  );
});

export default ItemRow;
