import { Svg } from "@svgdotjs/svg.js";
import ObjectBox from "./ObjectBox";
import Graph from "./graph";
import {
  EVENT_DRAG,
  EVENT_LINK,
  EVENT_MOVE,
  EVENT_SELECT,
  EVENT_UPDATE,
} from "@/garph/event";
import TextEditor from "./basic/TextEditor";
import DraggableRect from "./basic/DraggableRect";
import isOverlapping from "@/garph/utils/isOverlapping";
import LinkLine from "./LinkLine";
import { getDataType } from "./utils";

const PADDING_Y = 5;
const PADDING_X = 10;

interface Props {
  x: number;
  y: number;
  key: string;
  value: string | Object;
}

/**
 *
 * exact one parent - ObjectBox
 * exact one child -  ObjectBox
 *
 */

export default class KeyValueBox extends DraggableRect<ObjectBox> {
  protected keyChain = "";
  protected keyBox: TextEditor;
  protected valueBox: TextEditor;
  protected origin: { x: number; y: number } | null = null;
  child: ObjectBox | null = null;
  showChild: boolean = true;
  protected valueType: "string" | "object" | "array" = "string";
  protected line: LinkLine | null = null;
  constructor(
    protected draw: Svg,
    { x, y, key, value }: Props,
    graph: Graph,
    parent: ObjectBox
  ) {
    super(draw, { x, y, width: 0, height: 0 }, graph);

    this.valueType = getDataType(value);

    this.setParent(parent);
    this.rect.fill("white");
    this.graph.addKeyValueBox(this);
    // keyBox
    this.keyBox = new TextEditor(draw, key, x, y, graph);

    if (this.valueType !== "string") {
      this.child = new ObjectBox(
        draw,
        {
          x: 0,
          y: 0,
          value,
        },
        graph
      );
      this.graph.emit(EVENT_LINK, { keyvalueBox: this, objectBox: this.child });
    }

    this.valueBox = new TextEditor(
      draw,
      // @ts-ignore
      this.valueType === "array"
        ? "[]"
        : this.valueType === "object"
        ? "{}"
        : value,
      x,
      y,
      graph
    );

    this.valueBox.text.fill("green");

    this.initEvnet();
    this.setHeight();
    this.setWidth();
  }

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

  initEvnet() {
    this.valueBox.text.on("dblclick", () => {
      const v = window.prompt("dblclick");
      if (!v) return;
      this.valueBox.updateText(v);
      // if (v === "{}") {
      //   this.isObject = true;
      //   this.isKeyValueobject = true;
      //   this.isArrayObject = false;
      // } else if (v === "[]") {
      //   this.isObject = true;
      //   this.isKeyValueobject = false;
      //   this.isArrayObject = true;
      // } else {
      //   this.isObject = false;
      //   this.isKeyValueobject = false;
      //   this.isArrayObject = false;
      //   this.line?.delete();
      // }
      this.setWidth();
      this.setHeight();
      this.parent?.setWidth();
      this.parent?.setHeight();
      this.parent?.arrangeChildren();
    });
    this.rect.on("click", () => {
      this.graph.emit(EVENT_SELECT, { item: this });
    });

    this.rect.on("mouseover", () => {
      this.front();
      this.rect.attr({ "stroke-width": 3, stroke: "red" });
    });

    this.rect.on("mouseout", () => {
      if (this.graph.selectedItem === this) return;
      this.rect.attr({ "stroke-width": 1, stroke: "none" });
    });

    // this.rect.on("dragstart", () => {
    //   console.log("this is dragstart");
    //   this.graph.emit(EVENT_DRAG, { item: this });
    // });

    this.rect.on(
      "dragmove",
      (event) => {
        const { box } = (event as CustomEvent).detail;
        if (!this.origin) {
          this.origin = this.boundary;
        }
        this.move(box.x, box.y);
        if (this instanceof ObjectBox) return;
        this.graph.objectBoxes.forEach((child) => {
          if (isOverlapping(box, child)) {
            child.rect.attr({ "stroke-width": 3, stroke: "red" });
          } else {
            child.rect.attr({ "stroke-width": 1, stroke: "none" });
          }
        });
      },
      { passive: true }
    );

    this.rect.on("dragend", (event) => {
      for (const objectBox of this.graph.objectBoxes) {
        const overlap = isOverlapping(this, objectBox);
        if (overlap) {
          if (this.parent !== objectBox) {
            this.parent?.removeChildren(this);
            objectBox.addChildren(this);
            objectBox.rect.attr({ "stroke-width": 1, stroke: "none" });
          } else {
            if (this.origin) {
              this.move(this.origin.x, this.origin.y);
            }
          }
        } else {
          if (this.parent === objectBox) {
            objectBox.removeChildren(this);
          }
        }
      }
      this.origin = null;
    });

    // array key can not be changed
    if (!this.parent?.isArray) {
      this.keyBox.text.on("dblclick", () => {
        const v = window.prompt("dblclick");
        if (!v) return;
        this.keyBox.updateText(v);
        const { width, x, y } = this.keyBox.boundary;
        this.valueBox.move(x + width, y);
        this.setWidth();
        this.setHeight();
        this.parent?.setWidth();
        this.parent?.setHeight();
        this.parent?.move(this.boundary.x, this.boundary.y);
      });
    }
  }

  setLine(line: LinkLine | null) {
    this.line = line;
  }

  setChild(payload: ObjectBox | null) {
    this.child = payload;
  }

  front() {
    super.front();
    this.keyBox.front();
    this.valueBox.front();
  }

  move(x: number, y: number) {
    super.move(x, y);
    this.keyBox.move(x + PADDING_X, y + PADDING_Y);
    this.valueBox.move(
      x + PADDING_X + this.keyBox.boundary.width,
      y + PADDING_Y
    );
    this.emit(EVENT_MOVE);
  }

  setWidth() {
    const width = this.keyBox.boundary.width + this.valueBox.boundary.width + 2;
    super.setWidth(width + PADDING_X * 2);
  }

  setHeight() {
    super.setHeight(this.valueBox.boundary.height + PADDING_Y * 2);
  }

  show() {
    super.show();
    this.keyBox.show();
    this.valueBox.show();
  }

  hide() {
    super.hide();
    this.keyBox.hide();
    this.valueBox.hide();
  }

  delete() {
    super.remove();
    this.graph.emit(EVENT_UPDATE, { name: "deleteObjectBox" });
  }
}
