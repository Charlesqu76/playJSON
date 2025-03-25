import { G } from "@svgdotjs/svg.js";
import NormalRect from "../basic/NormalReact";
import Graph from "..";

interface IProps {
  x: number;
  y: number;
  width: number;
  height: number;
  style?: Record<string, string | number>;
}

export type TGroupRect = GroupRect;

export default class GroupRect {
  group: G;
  container: NormalRect;
  constructor({ x, y, width, height, style = {} }: IProps, graph: Graph) {
    if (!graph.canvas) throw new Error("Canvas is not initialized");
    this.group = graph.canvas.group();
    this.group?.draggable();
    this.container = new NormalRect(
      {
        x: x,
        y: y,
        width: width,
        height: height,
      },
      graph
    );

    this.container.rect.attr({
      stroke: "black",
      "stroke-width": 1,
      rx: 5,
      ry: 5,
      ...style,
    });
    this.group.add(this.container.rect);
  }
  add(SVGElement: any) {
    this.group?.add(SVGElement);
  }
  move(x: number, y: number) {
    this.group?.move(x, y);
  }

  delete() {
    this.group.remove();
    this.container.remove();
  }
}
