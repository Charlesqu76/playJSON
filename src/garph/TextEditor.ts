import { Svg, Text } from "@svgdotjs/svg.js";
import { Box } from "./box";

const size = 16;
const maxWidth = 100;

export default class TextEditor implements Box {
  text: Text;
  constructor(protected draw: Svg, text: string, x: number, y: number) {
    this.text = draw.text(text).move(x, y).font({ size: size });
  }

  updateText(newText: string) {
    this.text.text(newText);
  }

  move(x: number, y: number) {
    this.text.move(x, y);
  }

  get boundary() {
    const { width, height, x, y } = this.text.bbox();
    return { x, y, width, height };
  }

  get value() {
    return this.text.text();
  }

  click(callback: () => void) {
    this.text.on("click", callback);
  }

  hide() {
    this.text.hide();
  }

  show() {
    this.text.show();
  }
}
