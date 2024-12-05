export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function isPointInBox(point: Point, box: Box): boolean {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
}

export const getRightMid = (box: Box): Point => {
  const { x, y, width, height } = box;
  return {
    x: x + width / 2,
    y: y + height / 2,
  };
};
