import { Svg, Text } from "@svgdotjs/svg.js";
import { Box } from "./box";
import { Tspan } from "@svgdotjs/svg.js";
import Graph, { EVENT_UPDATE } from "./graph";

const size = 16;
const DEFAULT_MAX_WIDTH = 400;

export default class TextEditor implements Box {
  text: Text;
  graph: Graph;
  private maxWidth: number;

  constructor(
    protected draw: Svg,
    text: string,
    x: number,
    y: number,
    graph: Graph,
    maxWidth?: number
  ) {
    this.maxWidth = maxWidth ?? DEFAULT_MAX_WIDTH;
    this.graph = graph;
    this.text = this.draw
      .text((add) => this.addLine(add, String(text)))
      .move(x, y)
      .font({ size: size });
  }

  setWidth() {}
  setHeight() {}

  addLine = (add: Tspan | Text, text: string) => {
    const words = String(text)?.split(" ");
    let currentLine = "";

    words.forEach((word, index) => {
      const testLine = currentLine ? currentLine + " " + word : word;
      const tempText = this.draw.text(testLine).font({ size: 16 });
      const lineWidth = tempText.length();
      tempText.remove();
      if (lineWidth > this.maxWidth) {
        if (currentLine) {
          add.tspan(currentLine).newLine();
        }
        currentLine = word;
      } else {
        currentLine = testLine;
      }
      if (index === words.length - 1) {
        add.tspan(currentLine).newLine();
      }
    });
  };

  updateText(newText: string) {
    this.text.clear();
    this.text.build(true);
    this.addLine(this.text, newText);
    this.text.build(false);

    this.graph.eventEmitter.emit(EVENT_UPDATE, { name: "updateText" });
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
