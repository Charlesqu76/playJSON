import { Svg } from "@svgdotjs/svg.js";
import NormalRect from "./NormalReact";
import Graph from "../graph";

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
  config?: {
    ActiveStrokeColor?: string;
  };
}

export default class DraggableRect<P> extends NormalRect<P> {
  constructor(
    protected draw: Svg,
    { x, y, width, height }: Props,
    graph: Graph
  ) {
    super(draw, { x, y, width, height }, graph);
    this.rect.draggable();

    this.rect.on("mouseover", () => {
      this.rect.attr({
        cursor: "grab",
      });
    });

    this.rect.on("mouseout", () => {
      this.rect.attr({ cursor: "default" });
    });

    this.rect.on(
      "dragmove",
      (event) => {
        const { box } = (event as CustomEvent).detail;
        this.rect.move(box.x, box.y);
      },
      { passive: true }
    );
  }
}
