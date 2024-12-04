import { Svg } from "@svgdotjs/svg.js";
import TextBox from "./TextBox";

export default class ObjectSign extends TextBox {
  constructor(
    protected draw: Svg,
    { x, y, showChild }: { x: number; y: number; showChild: boolean }
  ) {
    super(draw, { x, y, text: showChild ? "-" : "+" });
    this.text.text.css({ cursor: "pointer" });
  }

  toggerShow = () => {
    this.text.updateText("-");
  };

  toggerHide = () => {
    this.text.updateText("+");
  };
}
