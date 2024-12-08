import { Svg } from "@svgdotjs/svg.js";
import { Rect } from "@svgdotjs/svg.js";
import { Box } from "./box";
import Graph from "../graph";
import EventEmitter from "../EventEmitter";

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default class NormalRect<P> implements Box {
  eventEmitter = new EventEmitter();
  rect: Rect;
  parent: P | null = null;
  graph: Graph;
  constructor(
    protected draw: Svg,
    { x, y, width, height }: Props,
    graph: Graph
  ) {
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

  setWidth() {}

  setHeight() {}

  show() {
    this.rect.show();
  }

  hide() {
    this.rect.hide();
  }

  setParent = (parent: P | null) => {
    this.parent = parent;
  };
}
