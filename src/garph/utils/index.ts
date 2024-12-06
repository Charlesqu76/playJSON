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
  const { x, y, width, height } = start;
  const { x: ex, y: ey, width: ewidth, height: eheight } = end;
  const controlPoint1 = {
    x: x + (ex - x) / 3,
    y: y + height / 2 - curveHeight,
  };
  const controlPoint2 = {
    x: x + (2 * (ex - x)) / 3,
    y: ey + eheight / 2 - curveHeight,
  };

  return `
              M${x + width},${y + height / 2} 
              C${controlPoint1.x},${controlPoint1.y} 
              ${controlPoint2.x},${controlPoint2.y} 
              ${ex},${ey + eheight / 2}
          `;
};
