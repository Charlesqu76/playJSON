import { Svg } from "@svgdotjs/svg.js";
import { Rect } from "@svgdotjs/svg.js";
import { Box } from "./box";

export default class NormalRect implements Box {
  rect: Rect;
  constructor(
    protected draw: Svg,
    {
      x,
      y,
      width,
      height,
    }: { x: number; y: number; width: number; height: number }
  ) {
    this.rect = draw
      .rect(width, height)
      .move(x, y)
      .attr({ fill: "none", stroke: "#000" });
  }

  move(x: number, y: number) {
    this.rect.move(x, y);
  }

  get boundary() {
    const { x, y, width, height } = this.rect.bbox();
    return { x, y, width, height };
  }

  hide = () => {
    this.rect.hide();
  };

  show = () => {
    this.rect.show();
  };
}
