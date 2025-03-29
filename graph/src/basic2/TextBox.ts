import Box from "@/basic/Box";
import Graph from "..";
import TestText from "@/basic/TestText";
import TextEditor, {
  EVENT_EDITING,
  text1,
  TTextEditor,
} from "@/basic/TextEditor";

const PADDING_X = 2;
const PADDING_Y = 2;

export const textPosition = (x: number, y: number) => {
  return {
    x: x + PADDING_X,
    y: y + PADDING_Y,
  };
};

export const calculateWidthAndHeight = (text: string) => {
  const { width, height } = text1(text);
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
  text: string;
  textBox?: TTextEditor;

  constructor({ x, y, text, style }: Props, graph: Graph) {
    const { width, height } = calculateWidthAndHeight(text);
    super({ width, height, x, y, graph });
    this.style = style;
    this.text = text;
  }

  render(x: number, y: number) {
    if (!this.graph.canvas) return;
    this.x = x ?? this.x;
    this.y = y ?? this.y;

    this.textBox = new TextEditor(
      {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        text: this.text,
        style: this.style,
      },
      this.graph
    );

    this.textBox?.group.on(EVENT_EDITING, (e) => {
      // @ts-ignore
      this.text = this.textBox?.value;
      const { width = 0, height = 0 } = this.textBox?.boundary || {};
      this.width = width;
      this.height = height;
    });
  }

  updateText(newText: string | number) {
    this.textBox?.updateText(newText);
    this.text = newText.toString();
  }

  hide() {
    if (!this.textBox) return;
    this.textBox.hide();
  }

  show() {
    if (!this.textBox) return;
    this.textBox.show();
  }

  front() {
    if (!this.textBox) return;
    this.textBox.front();
  }

  get value() {
    return this.textBox?.text;
  }

  get group() {
    return this.textBox?.group;
  }
}
