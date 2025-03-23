import Graph from "@/graph";
import TextBox from "@/graph/basic/TextBox";
import KeyValueBox from ".";
import { EVENT_UPDATE } from "../event";
import { EVENT_EDITING } from "../basic/TextEditor";
interface Props {
  text: string;
  x?: number;
  y?: number;
  height: number;
  width: number;
}
export default class KeyEditor extends TextBox<KeyValueBox> {
  constructor({ text, x, y, height, width }: Props, graph: Graph) {
    super({ text, x: x ?? 0, y: y ?? 0, height, width }, graph);
    // this.parent = parent;
    this.render(x || 0, y || 0);

    this.text?.on(EVENT_EDITING, () => {
      // this.parent.changed();
      this.graph.emit(EVENT_UPDATE, {
        name: "updateText",
      });
    });
    this.text?.fill("red");
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
