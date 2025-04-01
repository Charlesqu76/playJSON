import Graph from "..";
import { ForeignObject } from "@svgdotjs/svg.js";
import convertStringValue from "../utils/convertStringValue";
import GroupRect from "./GroupRect";

export const EVENT_EDITING = "textEditing";
export const PADDING_X = 4;
export const PADDING_Y = 4;
const size = "16px";
const DEFAULT_MAX_WIDTH = 300;

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
  private text: string;
  private span: HTMLSpanElement;
  private foreignObject: ForeignObject;
  private graph: Graph;
  private disabled: boolean = false;
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
    this.setWidthAndHeight(width, height, false);

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
    span.style.marginTop = PADDING_Y + "px";
    span.style.marginLeft = PADDING_X + "px";
    foreignObject.node.appendChild(span);
    span.innerHTML = text;
    this.span = span;

    this.group.on("click", (e) => {
      e.stopPropagation();
    });

    this.group.on("dblclick", (e) => {
      if (this.disabled) return;
      if (graph.selectedItem) {
        graph.selectedItem.unHighlight();
        graph.selectedItem = null;
      }
      if (this.graph.editting && this.graph.editting !== this) {
        this.graph.editting.unHighlight();
      }
      this.graph.editting = this;
      this.highlight();
      e.stopPropagation();
      this.graph.updateInputPosition();
      this.graph.inputText.show({
        text: this.text,
        color: style?.color || "black",
        onChange: (text, width, height) => {
          this.updateText(text, width, height);
        },
        onBlur: () => {
          this.unHighlight();
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
    this.span.innerHTML = this.text;
    this.setWidthAndHeight(width, height);
    this.group.fire(EVENT_EDITING, { text: text });
  }

  setWidthAndHeight(width: number, height: number, withPadding = true) {
    if (withPadding) {
      width += PADDING_X * 2;
      height += PADDING_Y * 2;
    }
    super.setWidth(width);
    super.setHeight(height);
    this.foreignObject.width(width);
    this.foreignObject.height(height);
  }

  setDisabled(disabled: boolean) {
    this.disabled = disabled;
    if (disabled) {
      this.group.attr("cursor", "not-allowed");
    } else {
      this.group.attr("cursor", "text");
    }
  }

  highlight(style?: Record<string, string | number>): void {
    super.highlight({
      stroke: "#92a8d1",
      "stroke-width": 1,
      ...style,
    });
  }

  unHighlight(): void {
    super.unHighlight({ stroke: "none" });
  }

  get value() {
    return convertStringValue(this.text);
  }

  get boundary() {
    return this.group.bbox();
  }
}
