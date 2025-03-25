import Graph from "..";
import EventEmitter from "../utils/EventEmitter";

interface IProps {
  x?: number;
  y?: number;
  width: number;
  height: number;
  graph: Graph;
}
export default class Box extends EventEmitter {
  x: number;
  y: number;
  width: number;
  height: number;
  graph: Graph;

  constructor({ x, y, width, height, graph }: IProps) {
    super();
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.width = width;
    this.height = height;
    this.graph = graph;
  }

  setWidth(width: number) {
    this.width = width;
  }
  setHeight(height: number) {
    this.height = height;
  }

  getWidth() {
    return this.width;
  }
  getHeight() {
    return this.height;
  }

  get boundary() {
    const { x, y, width, height } = this;
    return {
      x,
      y,
      width,
      height,
    };
  }
}

export type TBox = Box;
