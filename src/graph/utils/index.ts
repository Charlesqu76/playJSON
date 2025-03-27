import { TKeyvalueBox } from "../basic2/keyValueBox";
import { TObjectBox } from "../basic2/ObjectBox";

export interface Box {
  boundary: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Point {
  x: number;
  y: number;
}

export function isPointInBox(point: Point, box: Box): boolean {
  const { boundary } = box;
  return (
    point.x >= boundary.x &&
    point.x <= boundary.x + boundary.width &&
    point.y >= boundary.y &&
    point.y <= boundary.y + boundary.height
  );
}

export const getRightMid = (box: Box): Point => {
  const { boundary } = box;
  const { x, y, width, height } = boundary;
  return {
    x: x + width / 2,
    y: y + height / 2,
  };
};

export const getControlPoints = (
  start: TKeyvalueBox,
  end: TObjectBox,
  curveHeight = 0
) => {
  const { boundary: startBoundary } = start.container || {};
  const { boundary: endBoundary } = end.container || {};

  if (!endBoundary || !startBoundary) return;
  const startPoint = {
    x: startBoundary.x + startBoundary.width,
    y: startBoundary.y + startBoundary.height / 2,
  };

  const endPoint = {
    x: endBoundary.x,
    y: endBoundary.y + endBoundary.height / 2,
  };
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

export function getDataType(data: any) {
  if (typeof data === "object") {
    if (Array.isArray(data)) {
      return "array";
    }
    return "object";
  }
  return "string";
}
