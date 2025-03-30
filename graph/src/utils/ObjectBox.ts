import { TObjectBox } from "@/component/ObjectBox";
import { TKeyvalueBox } from "@/component/keyValueBox";

const PADDING_X = 5;
const PADDING_Y = 5;
const GAP = 5;
const MIN_WIDTH = 100;
const MIN_HEIGHT = 30;

export function getWidthAndHeight(children: Set<TKeyvalueBox>) {
  if (children.size === 0) {
    return { width: MIN_WIDTH, height: MIN_HEIGHT };
  }
  let height = 0;
  let width = 0;
  children.forEach((child) => {
    width = Math.max(width, child.boundary.width);
    height += child.height;
  });

  return {
    width: width + PADDING_X * 2,
    height: height + PADDING_Y * 2 + GAP * (children.size - 1),
  };
}

export function childrenPostion(
  children: Set<TKeyvalueBox>,
  x: number,
  y: number
) {
  children.forEach((child) => {
    child.render(x + PADDING_X, y + PADDING_Y);
    y += child.height + GAP;
  });
}

export function setChildrenWidth(children: Set<TKeyvalueBox>, width: number) {
  children.forEach((child) => {
    child.setWidthUnderParent(width - PADDING_X * 2);
    child.setHeight(child.height);
  });
}

export function value(item: TObjectBox) {
  if (item.isArray) {
    const m = [] as any;
    item.children.forEach((child) => {
      m.push(child.value);
    });
    return m;
  }
  const m = {};
  item.children.forEach((child) => {
    Object.assign(m, child.entry);
  });
  return m;
}
