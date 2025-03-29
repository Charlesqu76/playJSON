import Graph from "@/graph";
import TextBox from "../TextBox";

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
