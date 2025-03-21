import { Text } from "@svgdotjs/svg.js";
export const EVENT_EDITING = "editing";

const size = "16px";
const DEFAULT_MAX_WIDTH = 400;

interface Props {
  x: number;
  y: number;
  text: string;
  style?: {
    color: string;
  };
}

export default class EditText extends Text {
  maxWidth = DEFAULT_MAX_WIDTH;
  constructor({
    maxWidth,
    style,
    element,
  }: {
    maxWidth?: number;
    element: HTMLElement;
    style?: {
      color: string;
    };
  }) {
    super();
    this.maxWidth = maxWidth || DEFAULT_MAX_WIDTH;
    this.on("dblclick", () => {
      const input = document.createElement("textarea");
      const bbox = this.bbox();
      input.value = this.text();
      input.style.position = "absolute";
      input.style.left = `${bbox.x}px`;
      input.style.top = `${bbox.y}px`;
      input.style.resize = "none";
      input.style.zIndex = "9999";
      input.style.color = style?.color || "black";
      input.style.width = `${bbox.width}px`;
      input.style.maxWidth = `${this.maxWidth}px`;
      input.style.border = "none";
      input.style.padding = "0";
      input.style.margin = "0";
      input.style.scrollbarWidth = "none";
      input.style.outline = "none";
      input.style.backgroundColor = "rgba(255, 255, 255, 1)";
      input.style.boxShadow = "0 0 0 0";
      input.style.overflow = "hidden";
      input.style.height = `${bbox.height}px`;
      input.style.fontSize = "16px";
      input.style.lineHeight = "1.25";
      (input.style.fontFamily = "Arial, Helvetica, sans-serif"),
        element.appendChild(input);
      input.focus();

      const applyChanges = () => {
        this.updateText(input.value);
        this.fire(EVENT_EDITING, {
          text: input.value,
          x: bbox.x,
          y: bbox.y,
        });

        // this.emit(EVENT_EDITING, { text });
      };

      input.addEventListener("input", (e) => {
        applyChanges();
        this.text;
        input.style.width = this.bbox().width + "px";
        input.style.height = `${
          (e.target as HTMLTextAreaElement).scrollHeight
        }px`;
      });

      const removeInput = () => {
        element.removeChild(input);
      };

      // Handle input blur (clicking outside)
      input.addEventListener("blur", () => {
        removeInput();
      });

      // Handle Enter key press
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          removeInput();
          e.preventDefault();
        } else if (e.key === "Escape") {
          removeInput();
        }
      });
    });
  }

  updateText(text: string) {
    this.clear();
    this.build(true);
    const words = String(text)?.split(" ");
    let currentLine = "";

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
    this.build(false);
  }

  get boundary() {
    const { width, height, x, y } = this.bbox();
    return { x, y, width, height };
  }
}
