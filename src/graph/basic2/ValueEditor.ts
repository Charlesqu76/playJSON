import Graph from "..";
import { getDataType } from "../utils";
import TextBox from "./TextBox";
import ValueEditor1 from "../keyvalueBox/ValueEditor";

const VALUE_COLOR = "green";

interface IProps {}

export default class ValueEditor extends TextBox {
  valueType: "string" | "object" | "array" = "string";
  ValueEditor?: ValueEditor1;
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
    this.text = text;
    this.valueType = valueType;
  }

  render(x: number, y: number) {
    if (!this.graph) return;
    this.x = x ?? this.x;
    this.y = y ?? this.y;
    this.ValueEditor = new ValueEditor1(
      {
        x: this.x,
        y: this.y,
        text: this.text,
        // @ts-ignore
        value: this.valueType,
      },
      this.graph
    );
  }
}
