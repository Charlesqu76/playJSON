import Graph from "@/graph";
import TextBox from "@/graph/basic/TextBox";
import KeyValueBox from ".";
import { EVENT_UPDATE } from "../event";

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

  updateText(newText: string) {
    super.updateText(newText);
    this.graph.emit(EVENT_UPDATE, {
      name: "updateText",
      value: newText,
      self: this,
    });
  }
}
