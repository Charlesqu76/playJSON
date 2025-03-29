import { getDataType } from "@/utils";
import TextBox from "../TextBox";
import TB, { TTextBox as TTTextBox } from "@/basic/TextBox";
import { EVENT_EDITING } from "@/basic/TextEditor";
import Graph from "@/index";
import TextBox from "../TextBox";
import Graph from "@/index";
import { getText } from "@/utils/keyValueBox";

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
