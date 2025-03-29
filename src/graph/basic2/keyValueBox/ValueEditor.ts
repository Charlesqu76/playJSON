import TextBox from "../TextBox";
import Graph from "@/graph";
import { getText } from "@/graph/utils/keyValueBox";

const VALUE_COLOR = "green";
export type TValueEditor = ValueEditor;

export default class ValueEditor extends TextBox {
  constructor(
    text: string | object | any[],
    x: number,
    y: number,
    graph: Graph
  ) {
    super(
      { x, y, text: getText(text) as string, style: { color: VALUE_COLOR } },
      graph
    );
  }

  get group() {
    return this.textBox?.group;
  }
}
