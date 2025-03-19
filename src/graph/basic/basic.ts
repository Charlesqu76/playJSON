import EventEmitter from "../utils/EventEmitter";
import Graph from "..";
import { Svg } from "@svgdotjs/svg.js";

export default class Basic<P = null> extends EventEmitter {
  parent: P | null = null;
  graph: Graph;
  canvas: Svg;

  constructor(graph: Graph) {
    super();
    if (!graph || !graph.canvas) {
      throw new Error("graph is required");
    }
    this.graph = graph;
    this.canvas = graph.canvas;
  }

  setParent(payload: P | null) {
    this.parent = payload;
  }
}
