import { Text } from "@svgdotjs/svg.js";
import Graph from "..";
import { p } from "../utils/input";
export const EVENT_EDITING = "editing";

const size = "16px";
const DEFAULT_MAX_WIDTH = 400;

interface Props {
  maxWidth?: number;
  graph?: Graph;
  style?: {
    color: string;
  };
}

export default class EditText extends Text {
  maxWidth = DEFAULT_MAX_WIDTH;
  constructor({ maxWidth }: Props) {
    super();
    this.maxWidth = maxWidth || DEFAULT_MAX_WIDTH;
    this.build(true);

    this.on("dblclick", () => {
      const value = p(this.text());
      this.updateText(value);
      this.fire(EVENT_EDITING, {
        text: value,
      });
      return;
    });
  }

  updateText(text: string) {
    const words = String(text)?.split(" ");
    let currentLine = "";
    this.clear();
    words.forEach((word, index) => {
      const testLine = currentLine ? currentLine + " " + word : word;
      const t = new Text();
      t.text(testLine).font({ size: size });
      const { width } = t.bbox();
      t.remove();
      if (width > this.maxWidth) {
        if (currentLine) {
          this.tspan(currentLine).newLine();
        }
        currentLine = word;
      } else {
        currentLine = testLine;
      }
      if (index === words.length - 1) {
        this.tspan(currentLine).newLine();
      }
    });
  }

  get boundary() {
    const { width, height, x, y } = this.bbox();
    return { x, y, width, height };
  }
}
