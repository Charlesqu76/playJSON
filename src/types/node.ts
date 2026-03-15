export type AttrDragMode = "move" | "link";

export interface ActiveAttrDrag {
  mode: AttrDragMode;
  sourceBlockId: string;
  sourceAttrKey: string;
}
