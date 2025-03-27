import { Rect } from "@svgdotjs/svg.js";
import Graph from "..";
import EventEmitter from "../utils/EventEmitter";

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default class NormalRect extends EventEmitter {
  rect: Rect;

  constructor({ x = 0, y = 0, width, height }: Props, graph: Graph) {
    if (!graph.canvas) {
      throw new Error("canvas is required");
    }
    super();
    this.rect = graph.canvas
      ?.rect(width, height)
      .move(x, y)
      .attr({ fill: "none", stroke: "black" });
  }

  get boundary() {
    const { x, y, width, height } = this.rect.bbox();
    return { x, y, width, height };
  }

  get width() {
    return this.rect.bbox().width;
  }

  get height() {
    return this.rect.bbox().height;
  }

  setWidth(width: number) {
    this.rect.width(width);
  }

  setHeight(height: number) {
    this.rect.height(height);
  }

  move(x: number, y: number) {
    this.rect.move(x, y);
  }

  front() {
    this.rect.front();
  }

  show() {
    this.rect.show();
  }

  hide() {
    this.rect.hide();
  }

  back() {
    this.rect.back();
  }

  remove() {
    this.rect.remove();
  }

  highlight() {
    this.rect.attr({ "stroke-width": 3, stroke: "red" });
  }

  unHighlight() {
    this.rect.attr({ "stroke-width": 1, stroke: "black" });
  }
}
