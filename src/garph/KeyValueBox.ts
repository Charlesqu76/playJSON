import { Svg } from "@svgdotjs/svg.js";
import LinkLine from "./LinkLine";
import ObjectBox from "./ObjectBox";
import TextBox from "./TextBox";
import ObjectSign from "./ObjectSign";
import { Box } from "./box";
import { GG } from "./graph";

export default class KeyValueBox implements Box {
  protected keyBox: TextBox;
  protected valueBox: TextBox | ObjectSign;
  child: ObjectBox | null = null;
  protected parent: ObjectBox;
  protected line: LinkLine | null = null;
  showChild = true;
  protected gg: GG;
  constructor(
    protected draw: Svg,
    {
      x,
      y,
      key,
      value,
      parent,
      gg,
    }: {
      x: number;
      y: number;
      key: string;
      value: string;
      parent: ObjectBox;
      gg: GG;
    }
  ) {
    this.gg = gg;
    // key
    this.keyBox = new TextBox(draw, { text: key, x, y });
    this.keyBox.dblclick(() => {
      const { width, x, y } = this.keyBox.bbox;
      this.valueBox.move(x + width, y);
      this.parent.setWidth();
    });
    this.parent = parent;
    const { width } = this.keyBox.boundary;
    if (typeof value === "object") {
      this.valueBox = new ObjectSign(draw, {
        x: x + width,
        y: y,
        showChild: this.showChild,
      });

      this.valueBox.click(() => {
        this.toggleChildVisibility();
        console.log("asdfasdfads");
        setTimeout(() => {
          this.gg.layout();
        });
      });
      this.child = new ObjectBox(draw, {
        x: this.boundary.width + this.parent.boundary.width,
        y: y,
        value,
        gg,
      });
      this.line = new LinkLine(draw, this, this.child);
      if (!this.showChild) {
        this.child.hide();
        this.line.hide();
      } else {
        this.child.show();
        this.line.show();
      }
      this.child.rect.on("dragmove", () => {
        this.updateLine();
      });
    } else {
      // primative value
      this.valueBox = new TextBox(draw, { text: value, x: x + width, y });
      this.valueBox.dblclick(() => {
        this.parent.setWidth();
      });
    }
  }

  move = (x: number, y: number) => {
    this.keyBox.move(x, y);
    this.valueBox?.move(x + this.keyBox.bbox.width, y);
    this.updateLine();
  };

  updateLine = () => {
    if (!this.child) return;
    this.line?.update(this.valueBox, this.child);
  };

  toggleChildVisibility = () => {
    if (!this.child) return;
    if (this.showChild) {
      this.showChild = false;
      this.line?.show();
      this.child.show();
      this.valueBox.updateText("-");
    } else {
      this.showChild = true;
      this.line?.hide();
      this.child.hide();
      this.valueBox.updateText("+");
    }
  };

  get boundary() {
    const { x, y, width, height } = this.keyBox.boundary;
    return {
      x,
      y,
      width: width + this.valueBox.boundary.width,
      height: height,
    };
  }

  setWidth = (width: number) => {
    this.setWidth(width);
  };

  // just show this box and the line
  show = () => {
    this.keyBox.show();
    this.valueBox.show();
  };

  // hide all the children and the line
  hide = () => {
    this.keyBox.hide();
    this.line?.hide();
    this.valueBox.hide();
    if (this.child) {
      this.child.hide();
    }
    if (this.line) {
      this.line.hide();
    }
  };
}
