import { Svg } from "@svgdotjs/svg.js";
import TextBox from "./basic/TextBox";
import Graph from "./graph";
import ObjectBox from "./ObjectBox";
import { Line } from "@svgdotjs/svg.js";
import { getRightMid, isPointInBox } from "./utils";
import KeyValueBox from "./KeyValueBox";
import LinkLine from "./LinkLine";

export default class ObjectSign extends TextBox<KeyValueBox> {
  showChild: boolean = true;
  isObject: boolean = false;
  isKeyValueobject: boolean = false;
  isArrayObject: boolean = false;
  // parent: KeyValueBox;
  child: ObjectBox | null = null;
  line: LinkLine | null = null;
  sign: TextBox<KeyValueBox> | null = null;

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
    const isKeyValueobject = isObject && !Array.isArray(value);
    const isArray = Array.isArray(value);

    super(
      draw,
      { text: isObject ? (isArray ? "[]" : "{}") : value, x, y },
      graph
    );

    this.isObject = isObject;
    this.isKeyValueobject = isKeyValueobject;
    this.isArrayObject = isArray;
    this.setParent(parent);
    // this.text.text.fill("#0451A5");
    this.text.text.fill("green");

    if (this.isObject) {
      this.sign = this.initSign(x, y);

      this.child = new ObjectBox(
        draw,
        {
          x: 0,
          y: 0,
          value,
        },
        graph
      );

      this.line = new LinkLine(draw, this, this.child, this.graph);
      this.graph.addLinkLine(this.line);

      if (!this.showChild) {
        this.child.hide();
        this.line?.hide();
      }
    }

    this.text.text.css({ cursor: "pointer" });
    this.initEvent();
  }

  get value() {
    return this.child?.value || this.text.value;
  }

  get boundary() {
    const { x, y, width, height } = this.rect.bbox();
    return {
      x: x,
      y: y,
      width: width + (this.sign?.boundary.width || 0),
      height: height,
    };
  }

  initEvent = () => {
    this.text.text.on("mousedown", (event) => {
      if (!this.parent?.parent || !this.isObject) return;
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

    this.text.text.on("dblclick", () => {
      const v = window.prompt("dblclick");
      if (!v) return;
      this.updateText(v);
      if (v === "{}") {
        this.isObject = true;
        this.isKeyValueobject = true;
        this.isArrayObject = false;
      } else if (v === "[]") {
        this.isObject = true;
        this.isKeyValueobject = false;
        this.isArrayObject = true;
      } else {
        this.isObject = false;
        this.isKeyValueobject = false;
        this.isArrayObject = false;
        this.line?.delete();
      }
      this.parent?.setWidth();
      this.parent?.setHeight();
      this.parent?.parent?.setWidth();
      this.parent?.parent?.setHeight();
      this.parent?.parent?.arrangeChildren();
    });
  };

  front = () => {
    super.front();
    this.sign?.front();
  };

  linkToObject = (targetObjectBox: ObjectBox) => {
    console.log(targetObjectBox.parent);
    if (targetObjectBox.parent) {
      window.alert("This object is already linked to another object");
      return;
    }
    if (this.isArrayObject && !targetObjectBox.isArray) {
      window.alert("link to array object");
      return;
    }
    if (this.line) {
      this.line.delete();
    }

    this.line = new LinkLine(this.draw, this, targetObjectBox, this.graph);
  };

  show: () => void = () => {
    super.show();
    if (this.isObject) {
      this.sign?.show();
    }
  };

  hide: () => void = () => {
    super.hide();
    this.child?.hide();
    this.sign?.hide();
    this.line?.hide();
    this.showChild = false;
    this.sign?.updateText("+");
  };

  initSign = (x: number, y: number): TextBox<KeyValueBox> => {
    const sign = new TextBox<KeyValueBox>(
      this.draw,
      { text: this.showChild ? "-" : "+", x: x + super.boundary.width, y },
      this.graph
    );

    sign.text.text.css({ cursor: "pointer" });

    sign.text.text.on("click", () => {
      if (this.showChild) {
        sign.updateText("+");
        this.showChild = false;
        this.child?.hide();
        this.line?.hide();
      } else {
        sign.updateText("-");
        this.showChild = true;
        this.child?.show();
        this.line?.show();
      }
    });
    return sign;
  };

  move = (x: number, y: number) => {
    super.move(x, y);
    this.sign?.move(x + this.rect.bbox().width, y);
  };

  delete() {
    super.delete();
    this.sign?.delete();
    this.line?.delete();
  }
}
