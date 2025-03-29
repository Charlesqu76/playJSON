import { TKeyEditor } from "@/basic2/keyValueBox/KeyEditor";
import { TValueEditor } from "@/basic2/keyValueBox/ValueEditor";

const PADDING_Y = 5;
const PADDING_X = 10;
export function calculatePosition({
  x,
  y,
  keyBox,
}: {
  x: number;
  y: number;
  keyBox: TKeyEditor;
}) {
  const keyPostion = {
    x: x + PADDING_X,
    y: y + PADDING_Y,
  };
  const valuePosition = {
    x: x + keyBox.width + PADDING_X + 4 + 4,
    y: y + PADDING_Y,
  };
  return {
    keyPostion,
    valuePosition,
  };
}

export function calculateWidthAndHeight(
  keyBox: TKeyEditor,
  valueBox: TValueEditor
) {
  const width = keyBox.width + valueBox.width;
  const height = Math.max(keyBox.height, valueBox.height);
  return {
    width: width + PADDING_X * 2 + 8 + 4,
    height: height + PADDING_Y * 2 + 4,
  };
}
