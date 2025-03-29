import Graph from "@/index";
import TextBox from "../TextBox";
import TB, { TTextBox } from "@/basic/TextBox";
import { EVENT_EDITING } from "@/basic/TextEditor";

export type TKeyEditor = KeyEditor;
export default class KeyEditor extends TextBox {
  text: string;
  constructor(text: string, x: number, y: number, graph: Graph) {
    super({ text, x, y }, graph);
    this.text = text;
  }

  get group() {
    if (!this.textBox) return;
    return this.textBox.group;
  }
}
