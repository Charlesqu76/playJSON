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
    const { width: cw, height: ch } = child.boundary;
    width = Math.max(width, cw);
    height += ch;
  });

  return {
    width: width + PADDING_X * 2,
    height: height + PADDING_Y * 2 + GAP * (children.size - 1),
  };
}

export function renderChildren({
  children,
  x,
  y,
  width,
}: {
  children: Set<TKeyvalueBox>;
  x: number;
  y: number;
  width: number;
}) {
  x += PADDING_X;
  y += PADDING_Y;
  children.forEach((child) => {
    child.render(x, y);
    child.setWidth(width - PADDING_X * 2);
    child.setHeight(child.height);
    y += child.height + GAP;
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
