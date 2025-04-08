import { TTextBox } from "@/component/TextBox";

const PADDING_Y = 5;
const PADDING_X = 10;
const GAP = 5;
export function calculatePosition({
  x,
  y,
  keyBox,
  isArray,
}: {
  x: number;
  y: number;
  keyBox: TTextBox;
  isArray?: boolean;
}) {
  const keyPostion = {
    x: x + PADDING_X,
    y: y + PADDING_Y,
  };

  let valueX = x + PADDING_X;
  if (!isArray) {
    valueX += keyBox.width + GAP;
  }
  const valuePosition = {
    x: valueX,
    y: y + PADDING_Y,
  };
  return {
    keyPostion,
    valuePosition,
  };
}

export function calculateWidthAndHeight(
  keyBox: TTextBox,
  valueBox: TTextBox,
  isArray: Boolean = false
) {
  let width = valueBox.width;
  if (!isArray) {
    width += keyBox.width + GAP;
  }
  const height = Math.max(keyBox.height, valueBox.height);
  return {
    width: width + PADDING_X * 2,
    height: height + PADDING_Y * 2,
  };
}

export function isObject(value: any) {
  return typeof value === "object" && value !== null;
}

export function getText(value: string | any[] | Object) {
  if (Array.isArray(value)) {
    return "[]";
  }

  if (typeof value === "object" && value !== null) {
    return "{}";
  }

  return value;
}

interface IBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function isOverlapping(box1: IBox, box2: IBox) {
  const boundary = box1;
  const boundary2 = box2;
  return !(
    boundary.x + boundary.width < boundary2.x ||
    boundary2.x + boundary2.width < boundary.x ||
    boundary.y + boundary.height < boundary2.y ||
    boundary2.y + boundary2.height < boundary.y
  );
}
