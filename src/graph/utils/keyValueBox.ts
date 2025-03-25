import { TKeyEditor } from "../basic2/KeyEditor";
import { TValueEditor } from "../basic2/ValueEditor";

const PADDING_Y = 5;
const PADDING_X = 10;
export function calculatePosition({
  x,
  y,
  keyBox,
  isArray,
}: {
  x: number;
  y: number;
  keyBox: TKeyEditor;
  isArray?: boolean;
}) {
  const keyPostion = {
    x: x + PADDING_X,
    y: y + PADDING_Y,
  };
  const valuePosition = {
    x: x + (isArray ? 0 : keyBox.width) + PADDING_X + 4 + 4,
    y: y + PADDING_Y,
  };
  return {
    keyPostion,
    valuePosition,
  };
}

export function calculateHeight(valueBox: TValueEditor) {
  return valueBox.height + PADDING_Y * 2 + 4;
}

export function calculateWidth(
  keyBox: TKeyEditor,
  valueBox: TValueEditor,
  isArray: boolean
) {
  const width = isArray ? valueBox.width : keyBox.width + valueBox.width;
  return width + PADDING_X * 2 + 8 + 4;
}
