import { Svg } from "@svgdotjs/svg.js";
import LinkLine from "./LinkLine";
import ObjectBox from "./ObjectBox";
import TextBox from "./TextBox";
import ObjectSign from "./ObjectSign";
import { Box } from "./box";
import Graph from "./graph";
import DraggableRect from "./DraggableRect";
import { getRightMid, isPointInBox } from "./utils";
import { Line } from "@svgdotjs/svg.js";

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
  line: LinkLine | null = null;
  showChild = true;
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

      this.valueBox.text.on("mousedown", (event) => {
        event = event as MouseEvent;
        event.stopPropagation();

        let tempLine: Line | null = null;
        const svgPoint = (this.draw.node as SVGSVGElement).createSVGPoint();
        const startPos = getRightMid(this.valueBox.boundary);

        tempLine = this.draw
          .line(startPos.x, startPos.y, startPos.x, startPos.y)
          .stroke({ width: 2, color: "#000" });

        const mousemove = (e: MouseEvent) => {
          e.preventDefault();
          svgPoint.x = e.clientX;
          svgPoint.y = e.clientY;
          const cursor = svgPoint.matrixTransform(
            (this.draw.node as SVGSVGElement).getScreenCTM()?.inverse()
          );
          tempLine?.plot(startPos.x, startPos.y, cursor.x, cursor.y);
        };

        const mouseup = (e: MouseEvent) => {
          const cursor = svgPoint.matrixTransform(
            (this.draw.node as SVGSVGElement).getScreenCTM()?.inverse()
          );
          const objectBox = this.graph.objectBoxes.find((box) =>
            isPointInBox({ x: cursor.x, y: cursor.y }, box.boundary)
          );

          if (objectBox && this.child !== objectBox) {
            this.linkToObject(objectBox);
          }

          tempLine?.remove();
          tempLine = null;
          document.removeEventListener("mousemove", mousemove);
          document.removeEventListener("mouseup", mouseup);
        };

        document.addEventListener("mousemove", mousemove);
        document.addEventListener("mouseup", mouseup);
      });

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
      this.graph.addLinkLine(this.line);
      this.child.parent = this;
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
        setTimeout(() => {
          this.parent?.setWidth();
          this.parent?.setHeight();
        });
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

  linkToObject = (targetObjectBox: ObjectBox) => {
    console.log(targetObjectBox);
    if (targetObjectBox.parent) {
      window.alert("This object is already linked to another object");
      return;
    }
    if (this.child && this.line) {
      this.line.remove();
      this.child = null;
      this.line = null;
    }

    this.child = targetObjectBox;
    this.child.rect.on("dragmove", () => {
      this.updateLine();
    });
    this.line = new LinkLine(this.draw, this, targetObjectBox);
    this.graph.addLinkLine(this.line);
    this.showChild = true;
    this.valueBox.updateText("-");
    this.updateLine();
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
