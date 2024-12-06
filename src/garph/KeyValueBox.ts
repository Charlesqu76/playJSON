import { Svg } from "@svgdotjs/svg.js";
import ObjectBox from "./ObjectBox";
import TextBox from "./TextBox";
import ObjectSign from "./ObjectSign";
import { Box } from "./box";
import Graph from "./graph";
import DraggableRect from "./DraggableRect";

interface Props {
  x: number;
  y: number;
  key: string;
  value: string | Object;
}

export default class KeyValueBox extends DraggableRect implements Box {
  protected keyBox: TextBox;
  protected valueBox: ObjectSign;
  constructor(protected draw: Svg, { x, y, key, value }: Props, graph: Graph) {
    super(draw, { x, y, width: 0, height: 0 }, graph);
    this.graph.addKeyValueBox(this);
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
      this.rect.front();
      this.keyBox.front();
      this.valueBox.front();
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
        if (
          this.isOverlapping(box, objectBox.rect.bbox()) &&
          this.parent !== objectBox
        ) {
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
    this.valueBox = new ObjectSign(
      draw,
      {
        x: x + width,
        y: y,
        value: value,
        parent: this,
      },
      graph
    );

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
    this.eventEmitter.emit("move");
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

  get keyValue() {
    return this.keyBox.value;
  }

  get valueValue() {
    return this.valueBox.value;
  }

  get value() {
    return {
      [this.keyValue]: this.valueValue,
    };
  }

  get child() {
    if (this.valueBox instanceof ObjectSign) {
      return this.valueBox.child;
    }
    return null;
  }

  get showChild() {
    if (this.valueBox instanceof ObjectSign) {
      return this.valueBox.showChild;
    }
    return false;
  }

  show = () => {
    this.rect.show();
    this.keyBox.show();
    this.valueBox.show();
  };

  hide = () => {
    this.rect.hide();
    this.keyBox.hide();
    this.valueBox.hide();
  };
}
