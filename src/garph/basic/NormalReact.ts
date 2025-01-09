import { Svg } from "@svgdotjs/svg.js";
import { Rect } from "@svgdotjs/svg.js";
import { Box } from "./box";
import Graph from "../graph";
import EventEmitter from "../EventEmitter";
import Basic from "./basic";

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default class NormalRect<P> extends Basic<P> implements Box {
  rect: Rect;
  constructor(
    protected draw: Svg,
    { x, y, width, height }: Props,
    graph: Graph
  ) {
    super(graph);
    this.graph = graph;
    this.rect = draw.rect(width, height).move(x, y).attr({ fill: "none" });
  }

  get boundary() {
    const { x, y, width, height } = this.rect.bbox();
    return { x, y, width, height };
  }

  move(x: number, y: number) {
    this.rect.move(x, y);
  }

  front() {
    this.rect.front();
  }

  setWidth(width: number) {
    this.rect.width(width);
  }

  setHeight(height: number) {
    this.rect.height(height);
  }

  show() {
    this.rect.show();
  }

  hide() {
    this.rect.hide();
  }

  remove() {
    this.rect.remove();
  }

  setParent(parent: P | null) {
    this.parent = parent;
  }

  select() {
    this.rect.attr({ "stroke-width": 3, stroke: "red" });
  }

  unselect() {
    this.rect.attr({ "stroke-width": 1, stroke: "none" });
  }
}
