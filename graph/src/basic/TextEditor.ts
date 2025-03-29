import { ForeignObject } from "@svgdotjs/svg.js";

import Graph from "..";
import convertStringValue from "../utils/convertStringValue";
import GroupRect from "./GroupRect";
import { input } from "../utils/input";

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

export function text1(text: string) {
  const span = document.createElement("span");
  span.appendChild(document.createTextNode(text));
  span.style.fontSize = size;
  span.style.display = "inline-block";
  span.style.lineHeight = "1";
  span.style.fontFamily = "Arial, Helvetica, sans-serif";
  span.style.visibility = "hidden";
  span.style.maxWidth = "400px";
  span.style.wordBreak = "break-word";
  span.style.visibility = "hidden";
  span.style.whiteSpace = "nowrap";
  document.body.appendChild(span);
  const { width, height } = span.getBoundingClientRect();
  document.body.removeChild(span);
  return { width, height };
}

export type TTextEditor = TextEditor;

export default class TextEditor extends GroupRect {
  text: string;
  maxWidth: number;
  span: HTMLSpanElement;
  foreignObject: ForeignObject;
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

    this.text = text;
    this.group.draggable(false);

    this.maxWidth = maxWidth || DEFAULT_MAX_WIDTH;
    const foreignObject = this.group.foreignObject(width, height).attr({
      x: x + PADDING_X,
      y: y + PADDING_Y,
    });

    this.foreignObject = foreignObject;
    const span = document.createElement("span");
    span.style.fontSize = size;
    span.style.display = "inline-block";
    span.style.lineHeight = "1";
    span.style.fontFamily = "Arial, Helvetica, sans-serif";
    span.style.wordBreak = "break-word";
    span.style.maxWidth = `${this.maxWidth}px`;
    span.style.color = style?.color || "black";
    span.style.whiteSpace = "nowrap";

    foreignObject.node.appendChild(span);
    span.innerHTML = text;
    this.span = span;

    this.group.on("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // this.highlight();
      const { x, y, width, height } = this.group.bbox();
      input({
        text: span.innerHTML,
        top: y + PADDING_Y + 2,
        left: x + PADDING_X,
        width: width,
        height: height,
        color: style?.color || "black",
        onChange: ({ value }) => {
          this.updateText(value);
        },
        maxWidth: this.maxWidth,
        // @ts-ignore
        container: graph.container,
      });
    });
  }

  updateText(text: string | number) {
    const { width, height } = text1(text.toString());
    this.foreignObject.width(width);
    this.foreignObject.height(height + 4);
    this.span.innerHTML = text.toString();
    this.container.width(width + PADDING_X * 2);
    this.container.height(height + 4 + PADDING_Y * 2);
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
