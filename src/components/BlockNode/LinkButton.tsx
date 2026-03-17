import { memo } from "react";
import { Link } from "lucide-react";
import { cn } from "../../lib/utils";
import { ATTR_LINK_MIME } from "./const";
import { Handle, Position } from "@xyflow/react";

const toLinkPayload = (blockId: string, attrKey: string): string =>
  JSON.stringify({
    mode: "link",
    sourceBlockId: blockId,
    sourceAttrKey: attrKey,
  });

const LinkButton = memo(function LinkButton({
  id,
  isLinked,
  targetTitle,
  blockId,
  attrKey,
  onLinkDragStart,
  onLinkDragEnd,
  onUnlink,
}: {
  id: string;
  isLinked: boolean;
  targetTitle?: string;
  blockId: string;
  attrKey: string;
  onLinkDragStart: () => void;
  onLinkDragEnd: () => void;
  onUnlink: () => void;
}) {
  return (
    <Handle
      type="source"
      position={Position.Right}
      id={id}
      className="h-4! w-4! border-none! z-10 relative! "
      style={{
        background: "none",
        transform: "translate(0%, 0%)",
      }}
    >
      <span
        data-link-button
        className={cn(
          "transform block w-4 h-4 p-1 cursor-grab rounded-full bg-[rgba(37,99,235,0.12)] text-[#2563eb]",
          !isLinked && "bg-[rgba(138,127,118,0.15)] text-[#8a7f76]",
        )}
        aria-label={
          isLinked
            ? "Linked value. Click to unlink or drag to relink."
            : "Drag to link value to another block."
        }
        draggable
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        onDragStart={(event) => {
          event.stopPropagation();
          onLinkDragStart();
          event.dataTransfer.effectAllowed = "move";
          const payload = toLinkPayload(blockId, attrKey);
          event.dataTransfer.setData(ATTR_LINK_MIME, payload);
          event.dataTransfer.setData("text/plain", payload);
        }}
        onDragEnd={() => {
          onLinkDragEnd();
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (isLinked) {
            onUnlink();
          }
        }}
      >
        <Link className="w-full h-full" strokeWidth={2} aria-hidden="true" />
      </span>
    </Handle>
  );
});

export default LinkButton;
