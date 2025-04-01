import { TKeyvalueBox } from "@/component/keyValueBox";
import { TObjectBox } from "@/component/ObjectBox";

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

export function getDataType(data: any) {
  if (typeof data === "object") {
    if (Array.isArray(data)) {
      return "array";
    }
    return "object";
  }
  return "string";
}
