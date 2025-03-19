import { Rect } from "@svgdotjs/svg.js";
import { Box } from "./box";
import Graph from "..";
import Basic from "./basic";
import { highlightRect, unHighlightRect } from "../utils/rect";

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default class NormalRect<P> extends Basic<P> implements Box {
  rect: Rect;

  constructor({ x, y, width, height }: Props, graph: Graph) {
    super(graph);
    this.graph = graph;
    this.rect = this.canvas
      ?.rect(width, height)
      .move(x, y)
      .attr({ fill: "none" });
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

  render() {}

  select() {
    highlightRect(this.rect);
  }

  unselect() {
    unHighlightRect(this.rect);
  }
}
