import Graph from "..";

interface IProps {
  x?: number;
  y?: number;
  width: number;
  height: number;
  graph?: Graph;
}
export default class Box {
  x: number;
  y: number;
  width: number;
  height: number;
  graph: Graph | null = null;

  constructor({ x, y, width, height, graph }: IProps) {
    console.log("box", x, y, width, height);
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.width = width;
    this.height = height;
    this.graph = graph || null;
  }

  draw() {}
}

export type TBox = Box;
