import { Svg } from "@svgdotjs/svg.js";
import NormalRect from "./NormalReact";
import Graph from "./graph";
import ObjectBox from "./ObjectBox";

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
  config?: {
    ActiveStrokeColor?: string;
  };
}

const defaultConfig = {
  ActiveStrokeColor: "black",
};

export default class DraggableRect extends NormalRect {
  constructor(
    protected draw: Svg,
    { x, y, width, height, config = {} }: Props,
    graph: Graph
  ) {
    super(draw, { x, y, width, height }, graph);
    this.graph = graph;
    this.rect.draggable();

    this.rect.on("mouseover", () => {
      this.rect.attr({
        cursor: "grab",
        "stroke-width": 3,
      });
    });

    this.rect.on("mouseout", () => {
      // this.rect.attr({ "stroke-width": 1, stroke: "black" });
    });

    this.rect.on("dragmove", (event) => {
      const { box } = (event as CustomEvent).detail;
      this.rect.move(box.x, box.y);
    });
  }

  isOverlapping(
    box1: { x: number; y: number; width: number; height: number },
    box2: { x: number; y: number; width: number; height: number }
  ) {
    return !(
      box1.x + box1.width < box2.x ||
      box2.x + box2.width < box1.x ||
      box1.y + box1.height < box2.y ||
      box2.y + box2.height < box1.y
    );
  }
}
