import Box from "../basic/Box";
import Graph from "..";
import TestText from "../basic/TestText";

const PADDING_X = 2;
const PADDING_Y = 2;

export const textPosition = (x: number, y: number) => {
  return {
    x: x + PADDING_X,
    y: y + PADDING_Y,
  };
};

export const calculateWidthAndHeight = (text: string) => {
  const ss = new TestText({ text });
  const { width, height } = ss.boundary;
  return {
    width: width + PADDING_X * 2,
    height: height + PADDING_Y * 2,
  };
};

interface Props {
  x?: number;
  y?: number;
  text: string;
  style?: {
    color: string;
  };
}

export type TTextBox = TextBox;
export default class TextBox extends Box {
  style: any;
  value1: string;
  constructor({ x, y, text, style }: Props, graph: Graph) {
    const { width, height } = calculateWidthAndHeight(text);
    super({ width, height, x, y, graph });
    this.style = style;
    this.value1 = text;
  }
}
