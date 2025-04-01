import { G } from "@svgdotjs/svg.js";
import { Rect } from "@svgdotjs/svg.js";
import Graph from "..";
import EventEmitter from "../utils/EventEmitter";

interface IProps {
  x: number;
  y: number;
  width: number;
  height: number;
  style?: Record<string, string | number>;
}

export type TGroupRect = GroupRect;

export default class GroupRect extends EventEmitter {
  group: G;
  container: Rect;
  constructor({ x, y, width, height, style = {} }: IProps, graph: Graph) {
    super();
    if (!graph.canvas) throw new Error("Canvas is not initialized");
    this.group = graph.canvas.group();
    this.group?.draggable();
    this.container = new Rect({
      x: x,
      y: y,
      width: width,
      height: height,
    });

    this.container.attr({
      stroke: "black",
      "stroke-width": 1,
      fill: "transparent",
      rx: 5,
      ry: 5,
      ...style,
    });

    this.group.add(this.container);
  }

  add(SVGElement: any) {
    if (!SVGElement) return;
    this.group?.add(SVGElement);
  }
  move(x: number, y: number) {
    this.group?.move(x, y);
  }

  setWidth(width: number) {
    this.container.width(width);
  }

  setHeight(height: number) {
    this.container.height(height);
  }

  delete() {
    this.group.remove();
    this.container.remove();
  }

  front() {
    this.group.front();
    this.container.front();
  }

  hide() {
    this.group.hide();
  }

  show() {
    this.group.show();
  }

  highlight(style?: Record<string, string | number>) {
    this.container.attr({ "stroke-width": 3, stroke: "red", ...style });
  }

  unHighlight(style?: Record<string, string | number>) {
    this.container.attr({ "stroke-width": 1, stroke: "black", ...style });
  }

  get boundary() {
    return this.group.bbox();
  }

  get width() {
    return this.group.bbox().width;
  }

  get height() {
    return this.group.bbox().height;
  }
}
