import Graph from "..";
import { ForeignObject } from "@svgdotjs/svg.js";
import convertStringValue from "../utils/convertStringValue";
import GroupRect from "./GroupRect";

export const EVENT_EDITING = "textEditing";
const PADDING_X = 2;
const PADDING_Y = 2;
const size = "16px";
const DEFAULT_MAX_WIDTH = 400;

export const textPosition = (x: number, y: number) => {
  return {
    x: x + PADDING_X,
    y: y + PADDING_Y,
  };
};

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  style?: {
    maxWidth: number;
    color: string;
  };
}

export type TTextEditor = TextEditor;

export default class TextEditor extends GroupRect {
  text: string;
  maxWidth: number;
  span: HTMLSpanElement;
  foreignObject: ForeignObject;
  graph: Graph;
  constructor({ x, y, text, style, width, height }: Props, graph: Graph) {
    if (!graph.canvas) throw new Error("canvas not found");
    const { maxWidth = DEFAULT_MAX_WIDTH } = style || {};
    super(
      {
        x,
        y,
        width: width + PADDING_X * 2,
        height: height + PADDING_Y * 2,
        style: {
          stroke: "none",
        },
      },
      graph
    );

    this.graph = graph;
    this.text = text;
    this.group.draggable(false);
    this.group?.attr("cursor", "text");

    this.maxWidth = maxWidth || DEFAULT_MAX_WIDTH;
    const foreignObject = this.group
      .foreignObject(width + PADDING_X, height)
      .attr({
        x: x + PADDING_X,
        y: y + PADDING_Y,
      });

    this.foreignObject = foreignObject;
    this.foreignObject.attr({
      margin: "0",
      padding: "0",
      overflow: "hidden",
      "pointer-events": "none",
    });
    const span = document.createElement("span");
    span.style.fontSize = size;
    span.style.display = "inline-block";
    span.style.lineHeight = "normal";
    span.style.fontFamily = "Arial, Helvetica, sans-serif";
    span.style.wordBreak = "break-word";
    span.style.maxWidth = `${this.maxWidth}px`;
    span.style.color = style?.color || "black";
    span.style.whiteSpace = "break-spaces";
    span.style.overflowWrap = "break-word";

    foreignObject.node.appendChild(span);
    span.innerHTML = text;
    this.span = span;

    this.group.on("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const { x, y, width, height } = this.group.bbox();
      this.graph.inputText.show({
        x: x + 2,
        y: y + 2,
        text: this.text,
        color: style?.color || "black",
        onChange: (text, width, height) => {
          this.updateText(text, width, height);
        },
      });
    });
  }

  updateText(text: string | number, width: number = 0, height: number = 0) {
    if (!width || !height) {
      const { width: w, height: h } = this.graph.inputText.testWidthAndHeight(
        text.toString()
      );
      width = w;
      height = h;
    }
    this.text = text.toString();
    this.foreignObject.width(width + PADDING_X * 2);
    this.foreignObject.height(height);
    this.span.innerHTML = text.toString();
    this.container.width(width + PADDING_X * 2);
    this.container.height(height);
    this.group.fire(EVENT_EDITING, { text: text });
  }

  front() {
    this.group.front();
  }

  move(x: number, y: number) {
    this.group.move(x, y);
    this.container.move(x, y);
  }

  show() {
    this.group.show();
  }

  hide() {
    this.group.hide();
  }

  get value() {
    const value = this.span.innerHTML;
    return convertStringValue(value);
  }

  get boundary() {
    const { width, height, x, y } = this.group.bbox();
    return {
      width: width + PADDING_X * 2,
      height: height + PADDING_Y * 2,
      x,
      y,
    };
  }

  delete() {
    this.group.remove();
  }
}
