import { Svg } from "@svgdotjs/svg.js";
import NormalRect from "./NormalReact";
import Graph from "../graph";
import { G } from "@svgdotjs/svg.js";
import Basic from "./basic";

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
  config?: {
    ActiveStrokeColor?: string;
  };
}

export default class DraggableGroup<P> extends Basic<P> {
  group: G;
  graph: Graph;
  constructor(
    protected draw: Svg,
    { x, y, width, height }: Props,
    graph: Graph
  ) {
    super(graph);
    this.graph = graph;
    this.group = draw.group();
    this.rect = new NormalRect(draw, { x, y, width, height }, graph);
    this.group.add(this.rect.rect);
    this.group.draggable();
    // this.rect = this.group.rect(width, height).move(x, y);
    // console.log(this.rect);

    // this.rect.draggable();

    // this.group.on("mouseover", () => {
    //   //   this.rect.attr({
    //   //     cursor: "grab",
    //   //   });
    // });

    // this.group.on("mouseout", () => {
    //   this.group.attr({ cursor: "default" });
    // });

    // this.group.on(
    //   "dragmove",
    //   (event) => {
    //     const { box } = (event as CustomEvent).detail;
    //     this.group.move(box.x, box.y);
    //   },
    //   { passive: true }
    // );
  }

  get boundary() {
    const { x, y, width, height } = this.group.bbox();
    return { x, y, width, height };
  }

  setParent(parent: P) {}

  move(x: number, y: number) {
    this.group.move(x, y);
  }
}
