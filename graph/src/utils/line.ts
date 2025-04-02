import { TKeyvalueBox } from "@/component/keyValueBox";
import { TObjectBox } from "@/component/ObjectBox";

export const getControlPoints = (
  start: TKeyvalueBox,
  end: TObjectBox,
  curveHeight = 0
) => {
  const { boundary: startBoundary } = start.sign || {};
  const { boundary: endBoundary } = end || {};

  if (!endBoundary || !startBoundary) return;
  const startPoint = {
    x: startBoundary.x2,
    y: startBoundary.cy,
  };

  const endPoint = {
    x: end.x,
    y: end.y + end.height / 2,
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
