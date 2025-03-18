import { Svg } from "@svgdotjs/svg.js";
import Graph from "@/garph/graph";
import TextBox from "@/garph/basic/TextBox";
import KeyValueBox from ".";

export default class KeyEditor extends TextBox<KeyValueBox> {
  parent: KeyValueBox;
  constructor(
    text: string,
    x: number,
    y: number,
    graph: Graph,
    parent: KeyValueBox
  ) {
    super({ text, x, y }, graph);
    this.parent = parent;
    this.text.text.on("dblclick", () => {
      const v = window.prompt("dblclick");
      if (!v) return;
      this.updateText(v);
      this.parent.changed();
    });
  }
}
