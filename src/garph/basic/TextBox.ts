import { Svg } from "@svgdotjs/svg.js";
import NormalRect from "./NormalReact";
import TextEditor from "./TextEditor";
import { Box } from "./box";
import Graph from "../graph";
import { EVENT_MOVE } from "@/event";

const padding = 5;

export const textPosition = (x: number, y: number) => {
  return {
    x: x + padding,
    y: y + padding,
  };
};

interface Props {
  x: number;
  y: number;
  text: string;
}

export default class TextBox<P> extends NormalRect<P> implements Box {
  text: TextEditor;
  constructor(protected draw: Svg, { x, y, text }: Props, graph: Graph) {
    const position = textPosition(x, y);
    super(draw, { width: 0, height: 0, x, y }, graph);
    this.rect.attr({ stroke: "none" });
    this.text = new TextEditor(draw, text, position.x, position.y, graph);
    this.text.text.attr({ cursor: "pointer" });
    this.rect.width(this.boxAttrs.width);
    this.rect.height(this.boxAttrs.height);
  }

  get boxAttrs() {
    const { width, height } = this.text.boundary;
    return {
      width: width + padding * 2,
      height: height + padding * 2,
    };
  }

  updateText(newText: string) {
    this.text.updateText(newText);
    this.rect.width(this.boxAttrs.width);
    this.rect.height(this.boxAttrs.height);
  }

  move(x: number, y: number) {
    console.log("text move", x, y);
    const position = textPosition(x, y);
    this.text.move(position.x, position.y);
    this.rect.move(x, y);
    this.eventEmitter.emit(EVENT_MOVE);
  }

  hide() {
    this.text.hide();
    super.hide();
  }

  show() {
    this.text.show();
    super.show();
  }

  front() {
    this.text.text.front();
    this.rect.front();
  }

  get value() {
    return this.text.value;
  }
}
