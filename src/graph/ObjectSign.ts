import { Svg } from "@svgdotjs/svg.js";
import TextBox from "./basic/TextBox";
import Graph from ".";
import ObjectBox from "./ObjectBox";
import KeyValueBox from "./keyvalueBox";
import LinkLine from "./LinkLine";
import { EVENT_LINK } from "./event";

export default class ObjectSign extends TextBox<KeyValueBox> {
  showChild: boolean = true;
  isObject: boolean = false;
  isKeyValueobject: boolean = false;
  isArrayObject: boolean = false;
  child: ObjectBox | null = null;
  protected line: LinkLine | null = null;
  // sign: TextBox<KeyValueBox> | null = null;

  constructor(
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

    super(isObject ? (isArray ? "[]" : "{}") : value, x, y, graph);

    this.isObject = isObject;
    this.isKeyValueobject = isKeyValueobject;
    this.isArrayObject = isArray;
    // this.setParent(parent);
    // this.text.text.fill("#0451A5");
    this.text.fill("green");

    if (this.isObject) {
      this.sign = this.initSign(x, y);

      this.child = new ObjectBox(
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

  initEvent = () => {};

  front = () => {
    super.front();
    this.sign?.front();
    this.line?.front();
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
