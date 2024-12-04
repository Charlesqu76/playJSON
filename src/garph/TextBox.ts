import { Svg } from "@svgdotjs/svg.js";
import NormalRect from "./NormalReact";
import TextEditor from "./TextEditor";
import { Box } from "./box";
import Graph from "./graph";

const padding = 5;

const textPosition = (x: number, y: number) => {
  return {
    x: x + padding,
    y: y + padding,
  };
};

interface Props {
  x: number;
  y: number;
  text: string;
}

export default class TextBox extends TextEditor implements Box {
  box: NormalRect;
  constructor(protected draw: Svg, { x, y, text }: Props, graph: Graph) {
    const position = textPosition(x, y);
    super(draw, text, position.x, position.y);
    this.box = new NormalRect(draw, { ...this.boxAttrs, x, y }, graph);
  }

  get boundary() {
    return this.box.boundary;
  }

  get boxAttrs() {
    const { width, height } = super.boundary;
    return {
      width: width + padding * 2,
      height: height + padding * 2,
    };
  }

  updateText(newText: string) {
    super.updateText(newText);
    this.box.rect.width(this.boxAttrs.width);
    this.box.rect.height(this.boxAttrs.height);
  }

  move = (x: number, y: number) => {
    const position = textPosition(x, y);
    this.text.move(position.x, position.y);
    this.box.move(x, y);
  };

  dblclick(callback: () => void) {
    this.text.dblclick(() => {
      const v = window.prompt("dblclick");
      if (!v) return;
      this.updateText(v);
      callback();
    });
  }

  click(callback: () => void) {
    this.text.click(() => {
      callback();
    });
  }

  hide() {
    this.text.hide();
    this.box.hide();
  }

  show() {
    this.text.show();
    this.box.show();
  }
}
