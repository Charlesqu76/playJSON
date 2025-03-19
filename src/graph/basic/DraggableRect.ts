import { Svg } from "@svgdotjs/svg.js";
import NormalRect from "./NormalReact";
import Graph from "..";

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default class DraggableRect<P> extends NormalRect<P> {
  constructor({ x, y, width, height }: Props, graph: Graph) {
    super({ x, y, width, height }, graph);
    this.rect.draggable();

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
