export type ResizeHandleTarget = 'left' | 'right';

export interface ResizeDragState {
  target: ResizeHandleTarget;
  startX: number;
  startLeftWidth: number;
  startRightWidth: number;
  containerWidth: number;
}

export interface CopiedBlock {
  rootBlockId: string;
}
