import EventEmitter from "../EventEmitter";
import Graph from "../graph";

export default class Basic<P> extends EventEmitter {
  parent: P | null = null;
  graph: Graph;
  constructor(graph: Graph) {
    super();
    this.graph = graph;
  }

  setParent(payload: P | null) {
    this.parent = payload;
  }
}
