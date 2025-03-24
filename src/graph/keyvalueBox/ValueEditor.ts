import Graph from "..";
import { getRightMid, isPointInBox } from "../utils";
import TextBox from "../basic/TextBox";
import { EVENT_LINK, EVENT_UPDATE } from "../event";
import { Line } from "@svgdotjs/svg.js";
import KeyValueBox from ".";
import { highlightRect, unHighlightRect } from "../utils/rect";
import { EVENT_EDITING } from "../basic/TextEditor";

const VALUE_COLOR = "green";
export type TValueEdit = ValueEdit;

export interface IProps {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default class ValueEdit extends TextBox {
  constructor(
    { text, x = 0, y = 0, width = 100, height = 30 }: IProps,
    graph: Graph
  ) {
    super({ x, y, text, width, height, style: { color: VALUE_COLOR } }, graph);
    this.initEvnet();
  }
}
