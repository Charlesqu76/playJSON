import { TKeyvalueBox } from "../basic2/KeyValueBox";

const PADDING_X = 5;
const PADDING_Y = 5;
const GAP = 5;
const MIN_WIDTH = 100;

export function getWidth(children: Set<TKeyvalueBox>) {
  if (children.size === 0) {
    return MIN_WIDTH;
  }
  let width = 0;
  children.forEach((child) => {
    width = Math.max(width, child.width);
  });

  return width + PADDING_X * 2;
}

export function getHeight(children: Set<TKeyvalueBox>) {
  if (children.size === 0) {
    return 30;
  }
  let height = 0;
  children.forEach((child) => {
    height += child.height;
  });
  return height + PADDING_Y * 2 + GAP * (children.size - 1);
}

export function childrenPostion(
  children: Set<TKeyvalueBox>,
  x: number,
  y: number
) {
  children.forEach((child) => {
    if (!child.group) {
      child.render(x + PADDING_X, y + PADDING_Y);
    } else {
      child.move(x + PADDING_X, y + PADDING_Y);
    }
    y += child.height + GAP;
  });
}

export function setChildrenWidth(children: Set<TKeyvalueBox>, width: number) {
  children.forEach((child) => {
    child.container?.setWidth(width - PADDING_X * 2);
    child.container?.setHeight(child.height);
  });
}

