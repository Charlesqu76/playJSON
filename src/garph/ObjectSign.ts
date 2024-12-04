import { Svg } from "@svgdotjs/svg.js";
import TextBox from "./TextBox";
import Graph from "./graph";

export default class ObjectSign extends TextBox {
  constructor(
    protected draw: Svg,
    { x, y, showChild }: { x: number; y: number; showChild: boolean },
    graph: Graph
  ) {
    super(draw, { x, y, text: showChild ? "-" : "+" }, graph);
    this.text.css({ cursor: "pointer" });
  }

  toggerShow = () => {
    this.updateText("-");
  };

  toggerHide = () => {
    this.updateText("+");
  };
}
