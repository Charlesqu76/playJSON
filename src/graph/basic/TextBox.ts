import NormalRect from "./NormalReact";
import EditText from "./TextEditor";
import Graph from "..";
import { EVENT_MOVE } from "@/graph/event";
import convertStringValue from "../utils/convertStringValue";
import { G } from "@svgdotjs/svg.js";

const PADDING_X = 2;
const PADDING_Y = 2;

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
    color: string;
  };
}

const size = "16px";

export type TTextBox = TextBox;

export default class TextBox {
  group: G;
  text: EditText;
  container: NormalRect<any>;
  constructor({ x, y, text, style, width, height }: Props, graph: Graph) {
    if (!graph.canvas) throw new Error("canvas not found");
    this.group = graph.canvas?.group();

    this.container = new NormalRect(
      {
        x,
        y,
        width: width + PADDING_X * 2,
        height: height + PADDING_Y * 2,
      },
      graph
    );

    this.container.rect.attr({
      stroke: "none",
    });

    this.group.add(this.container.rect);

    // this.container({ width, height, x, y }, graph);
    this.text = new EditText({ style })
      .attr({
        "font-size": size,
        "line-height": "1",
        "font-family": "Arial, Helvetica, sans-serif",
      })
      .fill(style?.color || "black");
    this.group.add(this.text);
    this.text.updateText(text);
    // this.g.add(this.text);

    this.text.move(x + PADDING_X, y + PADDING_Y);
  }

  get boundary() {
    const { width, height, x, y } = this.text.boundary;
    return {
      width: width + PADDING_X * 2,
      height: height + PADDING_Y * 2,
      x,
      y,
    };
  }

  get value() {
    const value = this.text.text();
    return convertStringValue(value);
  }

  updateText(newText: string) {
    this.text.updateText(newText);
    // this.container.width(this.boundary.width);
    // this.container.height(this.boundary.height);
  }

  move(x: number, y: number) {
    this.container.move(x, y);
    const position = textPosition(x, y);
    this.text.move(position.x, position.y);
    // this.emit(EVENT_MOVE);
  }

  show() {
    this.text.show();
    this.container.show();
  }

  hide() {
    this.text.hide();
    this.container.hide();
  }

  front() {
    this.group.front();
    this.container.front();
    this.text.front();
  }
  back() {
    this.group.back();
    this.container.back();
    this.text.back();
  }

  delete() {
    this.group.remove();
  }
}
