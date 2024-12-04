import { Svg } from "@svgdotjs/svg.js";
import LinkLine from "./LinkLine";
import ObjectBox from "./ObjectBox";
import TextBox from "./TextBox";
import ObjectSign from "./ObjectSign";
import { Box } from "./box";
import { Graph } from "./graph";
import DraggableRect from "./DraggableRect";

interface Props {
  x: number;
  y: number;
  key: string;
  value: string | Object;
}

export default class KeyValueBox extends DraggableRect implements Box {
  protected keyBox: TextBox;
  protected valueBox: TextBox | ObjectSign;
  child: ObjectBox | null = null;
  protected line: LinkLine | null = null;
  showChild = true;
  constructor(protected draw: Svg, { x, y, key, value }: Props, graph: Graph) {
    super(draw, { x, y, width: 0, height: 0 }, graph);
    this.rect.fill("white");
    this.rect.on("dragmove", (event) => {
      const { box } = (event as CustomEvent).detail;
      if (this instanceof ObjectBox) return;
      this.graph.objectBoxes.forEach((child) => {
        if (this.isOverlapping(box, child.rect.bbox())) {
          child.rect.attr({ "stroke-width": 3, stroke: "red" });
        } else {
          child.rect.attr({ "stroke-width": 1, stroke: "black" });
        }
      });
    });

    this.rect.on("dragend", (event) => {
      const box = this.rect.bbox();
      for (const objectBox of this.graph.objectBoxes) {
        if (
          this.parent === objectBox &&
          !this.isOverlapping(box, objectBox.rect.bbox())
        ) {
          objectBox.removeChildren(this);
        }
      }

      for (const objectBox of this.graph.objectBoxes) {
        if (this.isOverlapping(box, objectBox.rect.bbox())) {
          // @ts-ignore
          this.parent?.removeChildren(this);
          objectBox.addChildren(this);
          objectBox.rect.attr({ "stroke-width": 1, stroke: "black" });
          break;
        }
      }
    });

    // key
    this.keyBox = new TextBox(draw, { text: key, x, y }, graph);
    this.keyBox.dblclick(() => {
      const { width, x, y } = this.keyBox.boundary;
      this.valueBox.move(x + width, y);
      this.parent?.setWidth();
      this.parent?.setHeight();
    });
    const { width } = this.keyBox.boundary;
    if (typeof value === "object") {
      this.valueBox = new ObjectSign(
        draw,
        {
          x: x + width,
          y: y,
          showChild: this.showChild,
        },
        graph
      );

      this.valueBox.click(() => {
        this.toggleChildVisibility();
        this.graph.layout();
      });

      this.child = new ObjectBox(
        draw,
        {
          x: this.boundary.width + (this.parent?.boundary.width || 0),
          y: y,
          value,
        },
        graph
      );
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
      this.valueBox = new TextBox(
        draw,
        { text: value, x: x + width, y },
        this.graph
      );
      this.valueBox.dblclick(() => {
        console.log("dblclick");
        this.parent?.setWidth();
        this.parent?.setHeight();
      });
    }

    this.setHeight();
    this.setWidth();

    this.rect.on("dragmove", (event) => {
      const { box } = (event as CustomEvent).detail;
      this.move(box.x, box.y);
    });
  }

  move = (x: number, y: number) => {
    this.rect.move(x, y);
    this.keyBox.move(x, y);
    this.valueBox?.move(x + this.keyBox.boundary.width, y);
    this.updateLine();
  };

  setWidth = () => {
    this.rect.width(
      this.keyBox.boundary.width + this.valueBox.boundary.width + 2
    );
  };

  setHeight = () => {
    this.rect.height(
      Math.max(
        this.keyBox.boundary.height + 2,
        this.valueBox.boundary.height + 2
      )
    );
  };

  updateLine = () => {
    if (!this.child) return;
    this.line?.update(this.valueBox, this.child);
  };

  toggleChildVisibility = () => {
    if (!this.child) return;
    if (!this.showChild) {
      this.showChild = true;
      this.line?.show();
      this.child.show();
      this.valueBox.updateText("-");
    } else {
      this.showChild = false;
      this.line?.hide();
      this.child.hide();
      this.valueBox.updateText("+");
    }
  };

  get value() {
    let value = "" as any;
    if (this.child) {
      value = this.child.value;
    } else {
      value = this.valueBox.value;
    }
    return { [this.keyBox.value]: value };
  }

  // just show this box and the line
  show = () => {
    this.showChild = true;
    if (this.child) {
      this.valueBox.updateText("-");
    }
    this.rect.show();
    this.keyBox.show();
    this.valueBox.show();
  };

  // hide all the children and the line
  hide = () => {
    this.showChild = false;
    if (this.child) {
      this.valueBox.updateText("+");
    }
    this.rect.hide();
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
