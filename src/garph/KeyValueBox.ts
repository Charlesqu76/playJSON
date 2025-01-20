import { Svg } from "@svgdotjs/svg.js";
import ObjectBox from "./ObjectBox";
import Graph from "./graph";
import {
  EVENT_LINK,
  EVENT_MOVE,
  EVENT_SELECT,
  EVENT_UPDATE,
} from "@/garph/event";
import TextEditor from "./basic/TextEditor";
import DraggableRect from "./basic/DraggableRect";
import isOverlapping from "@/garph/utils/isOverlapping";
import LinkLine from "./LinkLine";
import { getDataType, getRightMid, isPointInBox } from "./utils";

import { Line } from "@svgdotjs/svg.js";

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
  realWidth = 0;
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

    console.log(this, this.keyValue);

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

    console.log(this, this.keyValue);

    this.initEvnet();
    this.setHeight();
    this.setWidth();

    // this.setKeyChain();
    // console.log(this.keyChain);
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

  setKeyChain() {
    if (this.parent?.parent?.keyValue) {
      this.keyChain = this.parent?.parent?.keyValue + "." + this.keyValue;
    } else {
      this.keyChain = this.keyValue;
    }
  }

  initEvnet() {
    this.valueBox.text.on("mousedown", (event) => {
      if (!this.parent) return;
      event = event as MouseEvent;
      event.stopPropagation();

      let tempLine: Line | null = null;
      const svgPoint = (this.draw.node as SVGSVGElement).createSVGPoint();
      const startPos = getRightMid(this);

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
          isPointInBox({ x: cursor.x, y: cursor.y }, box)
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

    this.valueBox.text.on("dblclick", () => {
      const v = window.prompt("dblclick");
      if (!v) return;
      this.changeTypeValue(v);
      this.line?.delete();
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
          if (isOverlapping(this, child)) {
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
        // if (!overlap) {
        //   if (this.origin) {
        //     this.move(this.origin.x, this.origin.y);
        //   }
        //   continue;
        // }
        if (overlap) {
          if (this.parent === objectBox) {
            if (this.origin) {
              this.move(this.origin.x, this.origin.y);
            }
            return;
          }

          this.parent?.removeChildren(this);
          objectBox.addChildren(this);
          objectBox.rect.attr({ "stroke-width": 1, stroke: "none" });
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

  linkToObject(targetObjectBox: ObjectBox) {
    if (targetObjectBox.parent) {
      window.alert("This object is already linked to another object");
      return;
    }
    if (this.line) {
      this.line.delete();
    }
    this.graph.emit(EVENT_LINK, {
      keyvalueBox: this,
      objectBox: targetObjectBox,
    });
    this.changeTypeValue(targetObjectBox);
  }

  changeTypeValue(data: string | ObjectBox) {
    if (data instanceof ObjectBox) {
      if (data.isArray) {
        this.valueBox.updateText("[]");
        this.valueType = "array";
      } else {
        this.valueBox.updateText("{}");
        this.valueType = "object";
      }
    } else {
      this.valueBox.updateText(data);
      this.valueType = getDataType(data);
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
      x + PADDING_X + this.keyBox.boundary.width + 10,
      y + PADDING_Y
    );
    this.emit(EVENT_MOVE);
  }

  setWidth() {
    const width = this.keyBox.boundary.width + this.valueBox.boundary.width + 2;
    super.setWidth(width + PADDING_X * 2);
    this.realWidth = width;
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
