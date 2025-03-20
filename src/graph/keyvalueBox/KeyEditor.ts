import Graph from "@/graph";
import TextBox from "@/graph/basic/TextBox";
import KeyValueBox from ".";
import { EVENT_UPDATE } from "../event";
import { EVENT_EDITING } from "../basic/TextEditor";

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
    this.text.on(EVENT_EDITING, () => {
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
