import { memo } from "react";
import { cn } from "../../lib/utils";

const LinkButton = memo(function LinkButton({
  isLinked,
  targetTitle,
  onLinkDragStart,
  onLinkDragEnd,
  onUnlink,
}: {
  isLinked: boolean;
  targetTitle?: string;
  onLinkDragStart: () => void;
  onLinkDragEnd: () => void;
  onUnlink: () => void;
}) {
  return (
    <span
      className={cn(
        "nodrag nopan ml-auto inline-flex h-4 w-4 shrink-0 cursor-grab items-center justify-center rounded-full bg-[rgba(37,99,235,0.12)] text-[#2563eb]",
        !isLinked && "bg-[rgba(138,127,118,0.15)] text-[#8a7f76]",
      )}
      title={
        isLinked
          ? `Linked to ${targetTitle ?? "target"} (drag to relink, click to unlink)`
          : "Drag to another block to create link"
      }
      role="button"
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
      <svg
        className="h-3 w-3"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M10.59 13.41a1 1 0 0 1 0-1.41l2.83-2.83a3 3 0 1 1 4.24 4.24l-1.41 1.41M13.41 10.59a1 1 0 0 1 0 1.41l-2.83 2.83a3 3 0 1 1-4.24-4.24l1.41-1.41"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
});

export default LinkButton;
