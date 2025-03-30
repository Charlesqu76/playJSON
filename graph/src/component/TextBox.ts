import Box from "../basic/Box";
import Graph from "..";
import TextEditor, { EVENT_EDITING, TTextEditor } from "../basic/TextEditor";

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

export type TTextBox = TextBox;
export default class TextBox extends Box {
  style: any;
  text: string;
  textBox?: TTextEditor;

  constructor({ x, y, text, style }: Props, graph: Graph) {
    const { width, height } = graph.inputText.testWidthAndHeight(text);
    super({ width, height, x, y, graph });
    this.style = style;
    this.text = text;
  }

  render(x: number, y: number) {
    if (!this.graph.canvas) return;
    this.x = x ?? this.x;
    this.y = y ?? this.y;
    if (!this.textBox) {
      this.init();
    } else {
      this.move();
    }
  }

  init() {
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

  move() {
    if (!this.textBox) return;
    this.textBox.move(this.x, this.y);
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
