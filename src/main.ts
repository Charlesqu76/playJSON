// src/main.ts
import { SVG, Svg, Text, Rect, Line } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";
import LinkLine from "./LinkLine";

const draw = SVG().addTo("#app").size("100vw", "100vh");

const size = 16;
const padding = 5;
const lineHeight = 30;
const blockWidth = 200;

class NormalLine {
  line: Line;
  constructor(
    protected draw: Svg,
    { x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }
  ) {
    this.line = draw.line(x1, y1, x2, y2).attr({ stroke: "#000" });
  }

  update({
    x1,
    y1,
    x2,
    y2,
  }: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }) {
    this.line.plot(x1, y1, x2, y2);
  }
}

class NormalRect {
  protected rect: Rect;
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

  setWidth(width: number) {
    this.rect.width(width);
  }
  setHeight(height: number) {
    this.rect.height(height);
  }

  move(x: number, y: number) {
    this.rect.move(x, y);
  }

  get width() {
    return this.rect.width();
  }

  get height() {
    return this.rect.height();
  }

  get x() {
    return this.rect.x();
  }
  get y() {
    return this.rect.y();
  }
}

class DraggableRect extends NormalRect {
  constructor(
    protected draw: Svg,
    {
      x,
      y,
      width,
      height,
    }: { x: number; y: number; width: number; height: number }
  ) {
    super(draw, { x, y, width, height });
    this.rect.draggable();

    this.rect.on("mouseover", () => {
      this.rect.css({ cursor: "pointer" });
    });

    this.rect.on("dragmove", (event) => {
      const { box } = (event as CustomEvent).detail;
      this.rect.move(box.x, box.y);
    });
  }
}

class TextEditor {
  protected text: Text;
  constructor(protected draw: Svg, text: string, x: number, y: number) {
    this.text = draw.text(text).move(x, y).font({ size: size });
  }

  updateText(newText: string) {
    this.text.text(newText);
  }

  move(x: number, y: number) {
    this.text.move(x, y);
  }

  get bbox() {
    return this.text.bbox();
  }

  click(callback: () => void) {
    this.text.on("click", callback);
  }
}

class TextBox {
  protected text: TextEditor;
  protected box: NormalRect;
  constructor(
    protected draw: Svg,
    { x, y, text }: { x: number; y: number; text: string }
  ) {
    this.text = new TextEditor(draw, text, x + padding, y + padding);
    this.box = new NormalRect(draw, { ...this.bbox, x, y });
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
    this.box.setWidth(this.bbox.width);
    this.box.setHeight(this.bbox.height);
  }

  move = (x: number, y: number) => {
    this.text.move(x + 5, y + 5);
    this.box.move(x, y);
  };

  click(callback: () => void) {
    this.text.click(() => {
      const v = window.prompt("click");
      if (!v) return;
      this.updateText(v);
      callback();
    });
  }
}

class ObjectSign extends TextBox {
  protected fold: boolean = false;
  constructor(protected draw: Svg, { x, y }: { x: number; y: number }) {
    super(draw, { x, y, text: "-" });
    this.text.click(() => {
      if (this.fold) {
        this.text.updateText("-");
        this.fold = false;
      } else {
        this.text.updateText("+");
        this.fold = true;
      }
    });
  }
}

class KeyValueBox {
  protected key: TextBox;
  protected value: TextBox;
  protected child: ObjectBox | null = null;
  protected parent: ObjectBox | null = null;
  protected line: LinkLine | null = null;
  constructor(
    protected draw: Svg,
    { x, y, key, value }: { x: number; y: number; key: string; value: string }
  ) {
    this.key = new TextBox(draw, { text: key, x, y });
    const { width } = this.key.bbox;
    if (typeof value === "object") {
      this.value = new ObjectSign(draw, { x: x + width, y });
      this.child = new ObjectBox(draw, { x: x + 200, y, value });
      this.line = new LinkLine(
        draw,
        {
          x: this.value.bbox.x + this.value.bbox.width,
          y: this.value.bbox.y + this.value.bbox.height / 2,
        },
        { x: this.child.x, y: this.child.y + this.child.height / 2 }
      );
      this.child.rect.on("dragmove", (event) => {
        this.updateLine();
      });
    } else {
      this.value = new TextBox(draw, { text: value, x: x + width, y });
      this.value.click(() => {});
    }
    this.key.click(() => {
      const { width, x, y } = this.key.bbox;
      this.value.move(x + width, y);
    });
  }

  move = (x: number, y: number) => {
    this.key.move(x, y);
    this.value.move(x + this.key.bbox.width, y);
  };

  updateLine = () => {
    this.line?.update(
      {
        x: this.value.bbox.x + this.value.bbox.width,
        y: this.value.bbox.y + this.value.bbox.height / 2,
      },
      { x: this.child.x, y: this.child.y + this.child.height / 2 }
    );
  };
}

class ObjectBox extends DraggableRect {
  protected children: any;
  constructor(
    draw: Svg,
    { x, y, value }: { x: number; y: number; value: Object }
  ) {
    const entries = Object.entries(value);
    const children = entries.map(([key, value], index) => {
      return new KeyValueBox(draw, {
        x: x,
        y: y + lineHeight * index,
        key: key,
        value: value,
      });
    });
    const height = children.length * lineHeight;
    super(draw, { x: x, y: y, width: blockWidth, height });
    this.children = children;

    this.rect.on("dragmove", (event) => {
      const { box } = (event as CustomEvent).detail;
      this.rect.move(box.x, box.y);
      this.children.forEach((child: any, index: number) => {
        child.move(box.x, box.y + lineHeight * index);
        child.updateLine();
      });
    });
  }
}

new ObjectBox(draw, {
  x: 100,
  y: 100,
  value: {
    name: "charles",
    age: 18,
    hobbies: [{ name: "bed" }, { name: "basketball", level: 3 }],
    // address: { city: "shanghai", street: "nanjing road" },
  },
});
