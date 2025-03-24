import Graph from "@/graph";
import TextBox from "./TextBox";
import KeyEditor1, { TKeyEditor } from "../keyvalueBox/KeyEditor";
import TB, { TTextBox } from "../basic/TextBox";

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
  }

  front() {
    if (!this.textBox) return;
    this.textBox.front();
  }

  back() {
    if (!this.textBox) return;
    this.textBox.back();
  }
  get value() {
    return this.textBox?.text;
  }
}
