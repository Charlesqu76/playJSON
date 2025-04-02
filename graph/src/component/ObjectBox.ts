import KeyValueBox, { TKeyvalueBox } from "./keyValueBox";
import Graph from "..";
import { EVENT_ACTION, EVENT_CREATE, EVENT_SELECT } from "../event";
import Line, { EVENT_LINE_UPDATE, TLine } from "../basic/Line";
import GroupRect from "../basic/GroupRect";
import { renderChildren, getWidthAndHeight } from "../utils/ObjectBox";
import Box from "../basic/Box";
import { value } from "../utils/ObjectBox";
import checkCircle from "../utils/linkVerify";
import { G } from "@svgdotjs/svg.js";

interface Props {
  x?: number;
  y?: number;
  value: Object;
  parent?: TKeyvalueBox | null;
}

const OBJECT_COLOR = "#f3e8ff";
const ARRAY_COLOR = "#dbeafe";

/**
 * exact one parent - keyValueBox
 * children - KeyValueBoxes
 */
export type TObjectBox = ObjectBox;

export default class ObjectBox extends Box {
  isArray = false;
  private _line: TLine | null = null;
  private _parent: TKeyvalueBox | null = null;
  children: Set<TKeyvalueBox> = new Set([]);
  private groupRect?: GroupRect;
  container?: G;

  constructor({ x, y, value, parent = null }: Props, graph: Graph) {
    super({ width: 0, height: 0, graph, x, y });
    this.container = graph.canvas?.group();
    this.isArray = Array.isArray(value);
    const children = Object.entries(value).map(
      ([key, value]) =>
        new KeyValueBox(
          {
            key: key,
            value: value,
            parent: this,
          },
          graph
        )
    );
    this.children = new Set(children);
    const { width, height } = this.boundary;
    this.width = width;
    this.height = height;
    this.parent = parent;
    this.graph.emit(EVENT_CREATE, { item: this });
  }

  render(x: number = this.x, y: number = this.y) {
    this.x = x;
    this.y = y;
    if (!this.groupRect) {
      this._init();
    } else {
      this._move();
    }
    this.emit(EVENT_LINE_UPDATE);
  }

  private _init() {
    if (!this.graph?.canvas) throw new Error("canvas is not initialized");
    this.groupRect = new GroupRect(
      {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        style: {
          fill: this.isArray ? ARRAY_COLOR : OBJECT_COLOR,
          cursor: "move",
        },
      },
      this.graph
    );
    this.container?.add(this.groupRect.group);
    this.renderChildren();
    this.parent && this.link(this.parent);

    this.line?.path && this.container?.add(this.line.path);
    this.children.forEach((child) => {
      child.group && this.group?.add(child.group);
      if (child.child) {
        child.child.container && this.container?.add(child.child.container);
      }
    });

    this.initEvent();
  }

  private _move() {
    this.groupRect?.move(this.x, this.y);
    this.renderChildren();
  }

  initEvent() {
    this.group?.on("dragmove", (e) => {
      const { box } = (e as CustomEvent).detail;
      this.graph.recordAction("dragmove", box);
      this.render(box.x, box.y);
    });

    this.group?.on("dragend", (e) => {
      const { box } = (e as CustomEvent).detail;
      this.graph.recordAction("dragend", box);
      this.render(box.x, box.y);
    });

    this.group?.on("click", (e) => {
      this.graph.recordAction("click", {});
      this.graph.emit(EVENT_SELECT, { item: this });
      e.stopPropagation();
    });
  }

  layout(x = this.x, y = this.y) {
    this.render(x, y);
    this.children.forEach((child) => {
      child.layout();
    });
  }

  renderChildren() {
    const { width, height } = this.boundary;
    this.setHeight(height);
    this.setWidth(width);
    renderChildren({
      children: this.children,
      x: this.x,
      y: this.y,
      width: this.width,
    });
    this.children.forEach((child) => {
      child.emit(EVENT_LINE_UPDATE);
    });
    this.emit(EVENT_LINE_UPDATE);
  }

  addChildren(children: TKeyvalueBox | TKeyvalueBox[]) {
    if (!Array.isArray(children)) {
      children = [children];
    }

    children.forEach((child) => {
      if (this.group && child.group) {
        this.group.add(child.group);
      }
      this.children.add(child);
      child.parent = this;
    });

    this.renderChildren();
  }

  removeChildren(child: TKeyvalueBox) {
    this.children.delete(child);
    this.renderChildren();
  }

  setWidth(width: number): void {
    this.width = width;
    this.groupRect?.setWidth(this.width);
  }

  setHeight(height: number): void {
    this.height = height;
    this.groupRect?.setHeight(this.height);
  }

  link(keyValueBox: TKeyvalueBox) {
    if (!keyValueBox || !checkCircle(keyValueBox, this)) return;
    if (this.line) {
      this.unlink();
    }
    if (keyValueBox.child) {
      keyValueBox.child.unlink();
    }
    this.line = new Line(keyValueBox, this, this.graph);
  }

  unlink() {
    this.line?.unlink();
  }

  delete() {
    if (this.line) this.unlink();
    this.children.forEach((child) => {
      child.delete();
    });
    this.groupRect?.delete();
    this.graph.objectBoxes.delete(this);
  }

  front() {
    this.groupRect?.front();
    this.children.forEach((child) => {
      child.front();
    });
  }

  hide() {
    this.line?.hide();
    this.groupRect?.hide();
    this.children.forEach((child) => {
      child.hide();
    });
  }

  show() {
    this.line?.show();
    this.groupRect?.show();
    this.children.forEach((child) => {
      child.show();
    });
  }

  highlight() {
    this.groupRect?.highlight();
  }

  unHighlight() {
    this.groupRect?.unHighlight();
  }

  get boundary() {
    const { width, height } = getWidthAndHeight(this.children);
    return {
      x: this.x,
      y: this.y,
      width: width,
      height: height,
    };
  }

  get value() {
    return value(this);
  }

  get keyChain() {
    if (!this.parent) return [];
    return this.parent.keyChain;
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: TKeyvalueBox | null) {
    this._parent = parent;
    this.container && parent?.parent?.container?.add(this.container);
    this.line?.path && parent?.parent?.container?.add(this.line.path);
  }

  get group() {
    return this.groupRect?.group;
  }

  get line() {
    return this._line;
  }

  set line(line: TLine | null) {
    this._line = line;
  }
}
