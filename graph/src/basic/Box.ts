import Graph from "..";
import EventEmitter from "../utils/EventEmitter";

interface IProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  graph: Graph;
}
export default class Box extends EventEmitter {
  x: number = 0;
  y: number = 0;
  private _width: number = 0;
  protected _height: number = 0;
  graph: Graph;

  constructor({ x = 0, y = 0, width = 0, height = 0, graph }: IProps) {
    super();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.graph = graph;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  set width(width: number) {
    this._width = width;
  }

  set height(height: number) {
    this._height = height;
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
