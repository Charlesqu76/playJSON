import { memo } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "../../lib/utils";

const CollapseButton = memo(function CollapseButton({
  isCollapsed,
  isLinked,
  onClick,
}: {
  isCollapsed: boolean;
  isLinked: boolean;
  onClick: () => void;
}) {
  if (!isLinked) {
    // Placeholder to maintain alignment
    return <div className="h-4 w-4 shrink-0" />;
  }
  return (
    <button
      className={cn(
        "nodrag nopan inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#2563eb]",
        isCollapsed ? "bg-[rgba(37,99,235,0.25)]" : "bg-[rgba(37,99,235,0.12)]",
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={isCollapsed ? "Show linked block" : "Hide linked block"}
      aria-label={isCollapsed ? "Show linked block" : "Hide linked block"}
    >
      {isCollapsed ? (
        <Plus className="h-3 w-3" strokeWidth={2.5} />
      ) : (
        <Minus className="h-3 w-3" strokeWidth={2.5} />
      )}
    </button>
  );
});

export default CollapseButton;
