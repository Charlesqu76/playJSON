import Graph from "@/graph";
import TextBox from "./TextBox";
import KeyEditor1 from "../keyvalueBox/KeyEditor";

export default class KeyEditor extends TextBox {
  keyEditor?: KeyEditor1;
  text: string;
  constructor(text: string, x: number, y: number, graph: Graph) {
    super({ text, x, y }, graph);
    this.text = text;
  }

  render(x: number, y: number) {
    if (!this.graph) return;
    this.x = x ?? this.x;
    this.y = y ?? this.y;
    this.keyEditor = new KeyEditor1(
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
}
