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

export const getControlPoints = (start: Box, end: Box, curveHeight = 0) => {
  const startPoint = { x: start.x + start.width, y: start.y + start.height / 2 };
  const endPoint = { x: end.x, y: end.y + end.height / 2 };
  const xDiff = endPoint.x - startPoint.x;

  const controlPoint1 = {
    x: startPoint.x + xDiff / 3,
    y: startPoint.y - curveHeight,
  };
  const controlPoint2 = {
    x: startPoint.x + (2 * xDiff) / 3,
    y: endPoint.y - curveHeight,
  };

  return `M${startPoint.x},${startPoint.y} C${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${endPoint.x},${endPoint.y}`;
};
