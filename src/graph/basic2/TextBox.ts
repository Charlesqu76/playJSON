import Box from "./index";
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

interface Props {
  x?: number;
  y?: number;
  text: string;
  style?: {
    color: string;
  };
}

const size = "16px";

export default class TextBox extends Box {
  //   text?: EditText;
  style: any;
  value1: string;
  constructor({ x, y, text, style }: Props, graph: Graph) {
    const ss = new TestText({ text });
    const { width, height } = ss.boundary;
    super({ width, height, x, y, graph });
    this.style = style;
    this.value1 = text;
  }
}

export type TTextBox = TextBox;
