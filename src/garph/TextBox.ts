import { Svg } from "@svgdotjs/svg.js";
import NormalRect from "./NormalReact";
import TextEditor from "./TextEditor";
import { Box } from "./box";

const padding = 5;

export default class TextBox implements Box {
  text: TextEditor;
  box: NormalRect;
  constructor(
    protected draw: Svg,
    { x, y, text }: { x: number; y: number; text: string }
  ) {
    this.text = new TextEditor(draw, text, x + padding, y + padding);

    this.box = new NormalRect(draw, { ...this.bbox, x, y });
  }

  get boundary() {
    return this.box.boundary;
  }

  get value() {
    return this.text.value;
  }

  get bbox() {
    const { x, y, width, height } = this.text.bbox;
    return {
      x: x - padding,
      y: y - padding,
      width: width + padding * 2,
      height: height + padding * 2,
    };
  }

  updateText(newText: string) {
    this.text.updateText(newText);
    this.box.rect.width(this.bbox.width);
    this.box.rect.height(this.bbox.height);
  }

  move = (x: number, y: number) => {
    this.text.move(x + 5, y + 5);
    this.box.move(x, y);
  };

  dblclick(callback: () => void) {
    this.text.text.dblclick(() => {
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
