import JsonEditor from "./JsonEditor";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { BlockLink, JsonBlock } from "../types/model";

interface RightPanelProps {
  selectedBlock: JsonBlock | null;
  allBlocks: JsonBlock[];
  links: BlockLink[];
}

const RightPanel = ({ selectedBlock, allBlocks, links }: RightPanelProps) => {
  return (
    <Card className="overflow-auto p-0">
      <CardHeader>
        <CardTitle>Selected Block</CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedBlock ? (
          <div className="text-[0.9rem] text-[#6f655d]">
            Select a block to edit.
          </div>
        ) : (
          <JsonEditor
            block={selectedBlock}
            allBlocks={allBlocks}
            links={links}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default RightPanel;
