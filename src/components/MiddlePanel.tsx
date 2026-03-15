import { ReactFlowProvider } from "@xyflow/react";
import BoardCanvas from "./BoardCanvas";
import type { BoardState, JsonValue } from "../types/model";

interface MiddlePanelProps {
  state: BoardState;
  collapsedAttrLinks: ReadonlySet<string>;
  collapsedBlockIds: ReadonlySet<string>;
  arrayVisibleCount: ReadonlyMap<string, number>;
  expandedArrayItems: ReadonlySet<string>;
  selectedLinkId: string | null;
  hasSelectedBlock: boolean;
  showRightPanel: boolean;
  onShowRightPanel: () => void;
  onHideRightPanel: () => void;
  onAddObjectBlock: () => void;
  onAddArrayBlock: () => void;
  onFormat: () => Promise<void> | void;
  onExport: () => void;
  onResetBoard: () => void;
  onSelectBlock: (id: string | null) => void;
  onSelectLink: (id: string | null) => void;
  onToggleBlockExpand: (blockId: string) => void;
  onToggleArrayExpand: (blockId: string) => void;
  onToggleArrayItemExpand: (blockId: string, index: number) => void;
  onToggleAttrLinkCollapse: (blockId: string, attrKey: string) => void;
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

const MiddlePanel = (props: MiddlePanelProps) => {
  return (
    <div className="min-w-0 max-[1280px]:min-h-[55vh] flex-1 relative">
      <ReactFlowProvider>
        <BoardCanvas {...props} />
      </ReactFlowProvider>
    </div>
  );
};

export default MiddlePanel;
