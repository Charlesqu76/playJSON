import Graph from "..";
import EventEmitter from "../utils/EventEmitter";

interface IProps {
  x?: number;
  y?: number;
  width: number;
  height: number;
  graph?: Graph;
}
export default class Box extends EventEmitter {
  x: number;
  y: number;
  width: number;
  height: number;
  graph: Graph | null = null;
  parent: Box | null = null;

  constructor({ x, y, width, height, graph }: IProps) {
    super();
    // console.log("box", x, y, width, height);
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.width = width;
    this.height = height;
    this.graph = graph || null;
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

  setParent(parent: any) {
    this.parent = parent;
  }

  draw() {}

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
