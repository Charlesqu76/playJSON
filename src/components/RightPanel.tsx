import Draggable from "react-draggable";
import JsonEditor from "./JsonEditor";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import type { BlockLink, JsonBlock } from "../types/model";

interface RightPanelProps {
  selectedBlock: JsonBlock | null;
  allBlocks: JsonBlock[];
  links: BlockLink[];
  onClose: () => void;
}

const RightPanel = ({ selectedBlock, allBlocks, links, onClose }: RightPanelProps) => {
  // Only show the panel when a block is selected
  if (!selectedBlock) {
    return null;
  }

  return (
    <Draggable axis="both" defaultPosition={{ x: 0, y: 0 }}>
      <Card className="absolute right-10 top-[10%] z-10 flex w-full max-w-lg max-h-[80vh] flex-col overflow-hidden p-0 cursor-grab active:cursor-grabbing">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Selected Block</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-y-auto">
          <JsonEditor
            block={selectedBlock}
            allBlocks={allBlocks}
            links={links}
          />
        </CardContent>
      </Card>
    </Draggable>
  );
};

export default RightPanel;
