import { Svg } from "@svgdotjs/svg.js";
import DraggableRect from "./DraggableRect";
import KeyValueBox from "./KeyValueBox";
import { GG } from "./graph";

const lineHeight = 30;

export default class ObjectBox extends DraggableRect {
  children: KeyValueBox[] = [];
  constructor(
    draw: Svg,
    { x, y, value, gg }: { x: number; y: number; value: Object; gg: GG }
  ) {
    super(draw, { x, y, width: 0, height: 0 });
    const entries = Object.entries(value);
    this.children = entries.map(([key, value], index) => {
      return new KeyValueBox(draw, {
        x: x,
        y: y + lineHeight * index,
        key: key,
        value: value,
        parent: this,
        gg: gg,
      });
    });

    this.setWidth();
    this.setHeight();

    this.rect.on("dragmove", (event) => {
      const { box } = (event as CustomEvent).detail;
      this.move(box.x, box.y);
    });
  }

  setWidth = () => {
    const maxwWidth = this.children.reduce((acc, cur) => {
      return Math.max(acc, cur.boundary.width);
    }, 0);
    this.rect.width(maxwWidth);
  };

  setHeight = () => {
    const height = this.children.reduce((acc, cur) => {
      return acc + cur.boundary.height + 1;
    }, 0);
    this.rect.height(height);
  };

  move = (x: number, y: number) => {
    this.rect.move(x, y);
    this.children.forEach((child, index) => {
      child.move(x, y + lineHeight * index);
    });
  };

  show = () => {
    this.rect.show();
    this.children.forEach((child) => {
      child.show();
    });
  };

  hide = () => {
    this.rect.hide();
    this.children.forEach((child) => {
      child.hide();
    });
  };
}
