import { Svg } from "@svgdotjs/svg.js";
import TextBox from "./TextBox";
import Graph from "./graph";
import ObjectBox from "./ObjectBox";
import { Line } from "@svgdotjs/svg.js";
import { getRightMid, isPointInBox } from "./utils";
import KeyValueBox from "./KeyValueBox";
import LinkLine from "./LinkLine";

export default class ObjectSign extends TextBox {
  showChild: boolean = true;
  parent: KeyValueBox;
  child: ObjectBox | null = null;
  line: LinkLine | null = null;
  sign: TextBox;

  constructor(
    protected draw: Svg,
    {
      x,
      y,
      value,
      parent,
    }: { x: number; y: number; value: Object; parent: KeyValueBox },
    graph: Graph
  ) {
    const isObject = typeof value === "object";
    super(draw, { text: isObject ? "object" : value, x, y }, graph);
    this.sign = new TextBox(
      draw,
      { text: this.showChild ? "-" : "+", x: x + super.boundary.width, y },
      graph
    );

    this.sign.text.text.on("click", () => {
      if (this.showChild) {
        this.showChild = false;
        this.child?.hide();
        this.line?.hide();
      } else {
        this.showChild = true;
        this.child?.show();
        this.line?.show();
      }
      this.updateText(this.showChild ? "-" : "+");
      this.graph.layout();
    });

    this.moveCb = (x, y) => {
      this.sign.move(x + this.rect.bbox().width, y);
    };

    this.parent = parent;

    this.text.text.fill("green");
    if (isObject) {
      this.child = new ObjectBox(
        draw,
        {
          x: 0,
          y: 0,
          value,
        },
        graph
      );

      this.line = new LinkLine(draw, this, this.child);
      this.graph.addLinkLine(this.line);

      if (!this.showChild) {
        this.child.hide();
        this.line?.hide();
      }
    }

    this.text.text.on("mousedown", (event) => {
      event = event as MouseEvent;
      event.stopPropagation();

      let tempLine: Line | null = null;
      const svgPoint = (this.draw.node as SVGSVGElement).createSVGPoint();
      const startPos = getRightMid(this.parent.boundary);

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

    if (this.child) {
      this.sign.show();
    } else {
      this.sign.hide();
    }

    this.text.text.css({ cursor: "pointer" });
  }
  get value() {
    return this.child?.value || this.text.value;
  }

  get boundary() {
    const { x, y, width, height } = this.rect.bbox();
    return {
      x: x,
      y: y,
      width: width + this.sign.boundary.width,
      height: height,
    };
  }

  linkToObject = (targetObjectBox: ObjectBox) => {
    if (targetObjectBox.parent) {
      window.alert("This object is already linked to another object");
      return;
    }
    if (this.line) {
      this.line.breakLink();
    }

    this.line = new LinkLine(this.draw, this, targetObjectBox);
  };
}
