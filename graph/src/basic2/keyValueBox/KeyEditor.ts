import Graph from "@/index";
import TextBox from "../TextBox";
import TB, { TTextBox } from "@/basic/TextBox";
import { EVENT_EDITING } from "@/basic/TextEditor";

export type TKeyEditor = KeyEditor;

export default class KeyEditor extends TextBox {
  textBox?: TTextBox;
  text: string;
  constructor(text: string, x: number, y: number, graph: Graph) {
    super({ text, x, y }, graph);
    this.text = text;
  }

  render(x: number, y: number) {
    if (!this.graph) return;
    this.x = x ?? this.x;
    this.y = y ?? this.y;

    this.textBox = new TB(
      {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        text: this.text,
      },
      this.graph
    );
    this.textBox?.text.on(EVENT_EDITING, (e) => {
      // @ts-ignore
      this.text = this.textBox?.value;
      const { width = 0, height = 0 } = this.textBox?.boundary || {};
      this.width = width;
      this.height = height;
    });
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

  back() {
    if (!this.textBox) return;
    this.textBox.back();
  }

  updateText(newText: string | number) {
    this.textBox?.updateText(newText);
    this.text = newText.toString();
  }

  get value() {
    return this.textBox?.value;
  }

  get group() {
    if (!this.textBox) return;
    return this.textBox.group;
  }
}
