import { Svg } from "@svgdotjs/svg.js";
import TextBox from "./basic/TextBox";
import Graph from "./graph";
import ObjectBox from "./ObjectBox";
import { Line } from "@svgdotjs/svg.js";
import { getRightMid, isPointInBox } from "./utils";
import KeyValueBox from "./KeyValueBox";
import LinkLine from "./LinkLine";
import { EVENT_LINK } from "./event";
import TextEditor from "./basic/TextEditor";

export default class ObjectSign extends TextEditor {
  showChild: boolean = true;
  isObject: boolean = false;
  isKeyValueobject: boolean = false;
  isArrayObject: boolean = false;
  child: ObjectBox | null = null;
  protected line: LinkLine | null = null;
  // sign: TextBox<KeyValueBox> | null = null;

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

    super(draw, isObject ? (isArray ? "[]" : "{}") : value, x, y, graph);

    this.isObject = isObject;
    this.isKeyValueobject = isKeyValueobject;
    this.isArrayObject = isArray;
    // this.setParent(parent);
    // this.text.text.fill("#0451A5");
    this.text.fill("green");

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
      this.graph.emit(EVENT_LINK, { signBox: this, objectBox: this.child });

      if (!this.showChild) {
        this.child.hide();
        this.line?.hide();
      }
    }

    this.text.css({ cursor: "pointer" });
    this.initEvent();
  }

  get value() {
    return this.child?.value || this.text.value;
  }

  setLine(line: LinkLine | null) {
    this.line = line;
  }

  initEvent = () => {
    this.text.on("mousedown", (event) => {
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
  };

  front = () => {
    super.front();
    this.sign?.front();
    this.line?.front();
  };

  linkToObject = (targetObjectBox: ObjectBox) => {
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
    this.graph.emit(EVENT_LINK, { signBox: this, objectBox: targetObjectBox });
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
