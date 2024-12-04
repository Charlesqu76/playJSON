import { Svg } from "@svgdotjs/svg.js";
import NormalRect from "./NormalReact";

export default class DraggableRect extends NormalRect {
  constructor(
    protected draw: Svg,
    {
      x,
      y,
      width,
      height,
    }: { x: number; y: number; width: number; height: number }
  ) {
    super(draw, { x, y, width, height });
    this.rect.draggable();

    this.rect.on("mouseover", () => {
      // @ts-ignore
      this.rect.css({ cursor: "pointer", "stroke-width": 3, stroke: "red" });
    });

    this.rect.on("mouseout", () => {
      // @ts-ignore
      this.rect.css({ "stroke-width": 1, stroke: "black" });
    });

    this.rect.on("dragmove", (event) => {
      const { box } = (event as CustomEvent).detail;
      this.rect.move(box.x, box.y);
    });
  }
}
