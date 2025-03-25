import { Rect } from "@svgdotjs/svg.js";
import Graph from "..";
import { highlightRect, unHighlightRect } from "../utils/rect";
import { Svg } from "@svgdotjs/svg.js";
import EventEmitter from "../utils/EventEmitter";

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default class NormalRect extends EventEmitter {
  rect: Rect;
  width: number;
  height: number;
  x: number;
  y: number;
  graph: Graph;
  canvas: Svg;

  constructor({ x = 0, y = 0, width, height }: Props, graph: Graph) {
    if (!graph || !graph.canvas) {
      throw new Error("graph is required");
    }
    super();
    this.graph = graph;
    this.canvas = graph.canvas;
    this.graph = graph;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.rect = this.canvas
      ?.rect(width, height)
      .move(this.x, this.y)
      .attr({ fill: "none", stroke: "black" });
  }

  get boundary() {
    const { x, y, width, height } = this.rect.bbox();
    return { x, y, width, height };
  }

  move(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.rect.move(x, y);
  }

  front() {
    this.rect.front();
  }

  setWidth(width: number) {
    this.width = width;
    this.rect.width(width);
  }

  setHeight(height: number) {
    this.height = height;
    this.rect.height(height);
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

  select() {
    highlightRect(this.rect);
  }

  unselect() {
    unHighlightRect(this.rect);
  }
}
