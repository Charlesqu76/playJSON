import Draggable from "react-draggable";
import JsonEditor from "./JsonEditor";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { BlockLink, JsonBlock } from "../types/model";

interface RightPanelProps {
  selectedBlock: JsonBlock | null;
  allBlocks: JsonBlock[];
  links: BlockLink[];
}

const RightPanel = ({ selectedBlock, allBlocks, links }: RightPanelProps) => {
  // Only show the panel when a block is selected
  if (!selectedBlock) {
    return null;
  }

  return (
    <Draggable axis="both" defaultPosition={{ x: 0, y: 0 }}>
      <Card className="absolute right-10 top-[10%] z-10 flex w-full max-w-lg max-h-[80vh] flex-col overflow-hidden p-0 cursor-grab active:cursor-grabbing">
        <CardHeader>
          <CardTitle>Selected Block</CardTitle>
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
