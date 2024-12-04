import { Svg, Text } from "@svgdotjs/svg.js";

const size = 16;
const maxWidth = 100;

export default class TextEditor {
  text: Text;
  constructor(protected draw: Svg, text: string, x: number, y: number) {
    this.text = draw.text(text).move(x, y).font({ size: size });
    // this.text = draw.text((add) => {
    //   add.tspan(text).newLine;
    // });
  }

  updateText(newText: string) {
    this.text.text(newText);
  }

  move(x: number, y: number) {
    this.text.move(x, y);
  }

  get value() {
    return this.text.text();
  }

  get bbox() {
    return this.text.bbox();
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
