import { Circle } from "@svgdotjs/svg.js";
import Graph from "..";

interface IProps {
  x: number;
  y: number;
}

export type TSign = Sign;

export default class Sign {
  sign: Circle;
  constructor({ x, y }: IProps, graph: Graph) {
    if (!graph.canvas) {
      throw new Error("Graph is not defined");
    }
    this.sign = new Circle().radius(4).fill("black");
    this.sign.move(x, y);
    this.sign.on("mouseover", () => {
      this.sign.attr({ cursor: "pointer" });
      this.sign.radius(5);
    });
    this.sign.on("mouseout", () => {
      this.sign.radius(4);
    });
  }

  front() {
    this.sign.front();
  }

  hide() {
    this.sign.hide();
  }

  show() {
    this.sign.show();
  }

  move(x: number, y: number) {
    this.sign.move(x, y);
  }

  get boundary() {
    return this.sign.bbox();
  }
}
