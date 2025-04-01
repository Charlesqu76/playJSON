import Graph from "..";
import { ForeignObject } from "@svgdotjs/svg.js";
import convertStringValue from "../utils/convertStringValue";
import GroupRect from "./GroupRect";

export const EVENT_EDITING = "textEditing";
const PADDING_X = 2;
const PADDING_Y = 2;
const size = "16px";
const DEFAULT_MAX_WIDTH = 300;

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
  span: HTMLSpanElement;
  foreignObject: ForeignObject;
  graph: Graph;
  constructor({ x, y, text, style, width, height }: Props, graph: Graph) {
    if (!graph.canvas) throw new Error("canvas not found");
    super(
      {
        x,
        y,
        width: 0,
        height: 0,
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

    const foreignObject = this.group.foreignObject(0, 0).attr({
      x: x,
      y: y,
    });

    this.foreignObject = foreignObject;
    this.setWidthAndHeight(width, height);
    this.foreignObject.attr({
      overflow: "hidden",
    });

    const div = document.createElement("div");
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.paddingTop = PADDING_Y + "px";
    div.style.paddingLeft = PADDING_X + "px";

    const span = document.createElement("span");
    span.style.fontSize = size;
    span.style.display = "block";
    span.style.lineHeight = "normal";
    span.style.fontFamily = "Arial, Helvetica, sans-serif";
    span.style.wordBreak = "break-word";
    span.style.maxWidth = `${DEFAULT_MAX_WIDTH}px`;
    span.style.color = style?.color || "black";
    span.style.whiteSpace = "break-spaces";
    span.style.overflowWrap = "break-word";
    foreignObject.node.appendChild(div);
    div.appendChild(span);
    span.innerHTML = text;
    this.span = span;

    this.group.on("dblclick", (e) => {
      this.graph.editting = this;
      e.preventDefault();
      e.stopPropagation();
      const { x, y } = this.group.rbox();
      this.graph.inputText.show({
        x: x,
        y: y,
        scale: this.graph.zoom,
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
    this.span.innerHTML = text.toString();
    this.setWidthAndHeight(width, height);
    this.group.fire(EVENT_EDITING, { text: text });
  }

  setWidthAndHeight(width: number, height: number) {
    this.container.width(width + PADDING_X);
    this.container.height(height);
    this.foreignObject.width(width + PADDING_X);
    this.foreignObject.height(height);
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

  delete() {
    this.group.remove();
  }

  get value() {
    return convertStringValue(this.text);
  }

  get boundary() {
    const { width, height, x, y } = this.group.bbox();
    return {
      width,
      height,
      x,
      y,
    };
  }
}
