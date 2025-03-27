import { getDataType } from "../../utils";
import TextBox from "../TextBox";
import TB, { TTextBox as TTTextBox } from "../../basic/TextBox";
import { EVENT_EDITING } from "../../basic/TextEditor";
import Graph from "@/graph";

const VALUE_COLOR = "green";
export type TValueEditor = ValueEditor;

export default class ValueEditor extends TextBox {
  valueType: "string" | "object" | "array" = "string";
  textBox?: TTTextBox;
  text: string | object | any[];

  constructor(
    text: string | object | any[],
    x: number,
    y: number,
    graph: Graph
  ) {
    const valueType = getDataType(text);
    let a;
    switch (valueType) {
      case "object":
        a = "{}";
        break;
      case "array":
        a = "[]";
        break;
      default:
        a = text;
        break;
    }
    super({ x, y, text: a as string, style: { color: VALUE_COLOR } }, graph);
    this.text = a;
    this.valueType = valueType;
  }

  render(x: number, y: number) {
    if (!this.graph) return;
    this.x = x ?? this.x;
    this.y = y ?? this.y;
    this.textBox = new TB(
      {
        x: this.x,
        y: this.y,
        text: this.text as string,
        width: this.width,
        height: this.height,
        style: {
          color: VALUE_COLOR,
        },
      },
      this.graph
    );

    this.textBox?.text.on(EVENT_EDITING, (event) => {
      const { width = 0, height = 0 } = this.textBox?.boundary || {};
      this.width = width;
      this.height = height;
    });
  }

  front() {
    if (!this.textBox) return;
    this.textBox.front();
  }
  back() {
    if (!this.textBox) return;
    this.textBox.back();
  }

  updateText(newText: string): void {
    this.textBox?.updateText(newText);
  }

  get value() {
    return this.textBox?.value;
  }

  get group() {
    return this.textBox?.group;
  }
}
