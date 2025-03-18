import { Svg } from "@svgdotjs/svg.js";
import NormalRect from "./NormalReact";
import TextEditor from "./TextEditor";
import { Box } from "./box";
import Graph from "../graph";
import { EVENT_MOVE } from "@/garph/event";

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
  text: string;
}

export default class TextBox<P> extends NormalRect<P> implements Box {
  text: TextEditor;
  constructor({ x, y, text }: Props, graph: Graph) {
    const position = textPosition(x, y);
    super({ width: 0, height: 0, x, y }, graph);
    this.text = new TextEditor(text, position.x, position.y, graph);
    this.text.text.attr({ cursor: "pointer" });
    this.text.text.width(this.boundary.width);
    this.text.text.height(this.boundary.height);
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
    return this.text.value;
  }

  updateText(newText: string) {
    this.text.updateText(newText);
    this.rect.width(this.boundary.width);
    this.rect.height(this.boundary.height);
  }

  move(x: number, y: number) {
    this.rect.move(x, y);
    const position = textPosition(x, y);
    this.text.move(position.x, position.y);
    this.emit(EVENT_MOVE);
  }

  show() {
    this.text.show();
    super.show();
  }

  hide() {
    this.text.hide();
    super.hide();
  }

  front() {
    this.text.front();
    super.front();
  }

  delete() {
    this.text.text.remove();
  }
}
