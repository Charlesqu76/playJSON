import Box from "../basic/Box";
import Graph from "..";
import TextEditor, { EVENT_EDITING, TTextEditor } from "../basic/TextEditor";

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
  private _text: string | number | undefined | null | boolean;
  textBox?: TTextEditor;

  constructor({ x, y, text, style }: Props, graph: Graph) {
    const { width, height } = graph.inputText.testWidthAndHeight(text);
    super({ width, height, x, y, graph });
    this.style = style;
    this._text = text;
  }

  render(x: number = this.x, y: number = this.y) {
    if (!this.graph.canvas) return;
    this.x = x;
    this.y = y;
    if (!this.textBox) {
      this._init();
    } else {
      this._move();
    }
  }

  private _init() {
    this.textBox = new TextEditor(
      {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        text: String(this._text),
        style: this.style,
      },
      this.graph
    );

    this.textBox?.group.on(EVENT_EDITING, () => {
      const { width = 0, height = 0 } = this.textBox?.boundary || {};
      this.width = width;
      this.height = height;
    });
  }

  private _move() {
    this.textBox?.move(this.x, this.y);
  }

  updateText(newText: string | number) {
    this.textBox?.updateText(newText);
    this._text = newText;
  }

  hide() {
    this.textBox?.hide();
  }

  show() {
    this.textBox?.show();
  }

  front() {
    this.textBox?.front();
  }

  get value() {
    return this.textBox?.value;
  }

  get group() {
    return this.textBox?.group;
  }

  get boundary() {
    const {
      x = 0,
      y = 0,
      width = 0,
      height = 0,
    } = this.textBox?.boundary || {};
    return { x, y, width, height };
  }
}
