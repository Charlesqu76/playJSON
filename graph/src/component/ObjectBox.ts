import KeyValueBox, { TKeyvalueBox } from "./keyValueBox";
import Graph from "..";
import {
  EVENT_CREATE,
  EVENT_MOUSEOUT,
  EVENT_MOUSEOVER,
  EVENT_SELECT,
} from "../event";
import Line, { EVENT_LINE_UPDATE, TLine } from "../basic/Line";
import { layoutTree } from "../utils/layout";
import GroupRect from "../basic/GroupRect";
import {
  childrenPostion,
  getWidthAndHeight,
  setChildrenWidth,
} from "../utils/ObjectBox";
import Box from "../basic/Box";
import { value } from "../utils/ObjectBox";
import checkCircle from "../utils/linkVerify";

interface Props {
  x: number;
  y: number;
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
  groupRect?: GroupRect;

  constructor({ value, parent = null }: Props, graph: Graph) {
    super({ width: 0, height: 0, graph });
    this.isArray = Array.isArray(value);
    const children = Object.entries(value).map(
      ([key, value]) =>
        new KeyValueBox(
          {
            isArray: this.isArray,
            key: key,
            value: value,
            parent: this,
          },
          graph
        )
    );
    this.children = new Set(children);
    const { width, height } = getWidthAndHeight(this.children);
    this.width = width;
    this.height = height;
    this.parent = parent;
    this.graph.emit(EVENT_CREATE, { item: this });
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
    if (!parent) {
      this.graph.noParentObjectBoxes.add(this);
    } else {
      this.graph.noParentObjectBoxes.delete(this);
    }
    this._parent = parent;
  }

  render(x: number = this.x, y: number = this.y) {
    this.x = x ?? this.x;
    this.y = y ?? this.y;
    if (!this.groupRect) {
      this.init();
    } else {
      this.move(this.x, this.y);
    }
    this.parent && this.link(this.parent);
  }

  init() {
    if (!this.graph?.canvas) throw new Error("canvas is not initialized");
    this.groupRect = new GroupRect(
      {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        style: {
          fill: this.isArray ? ARRAY_COLOR : OBJECT_COLOR,
        },
      },
      this.graph
    );

    if (!this.group || !this.container) return;

    childrenPostion(this.children, this.x, this.y);
    setChildrenWidth(this.children, this.width);

    this.children.forEach((child) => {
      child.group && this.group?.add(child.group);
    });

    this.group?.on("dragmove", (e) => {
      const { box } = (e as CustomEvent).detail;
      this.move(box.x, box.y);
      // this.children.forEach((child) => {
      //   child.emit(EVENT_LINE_UPDATE);
      // });
    });

    this.group?.on("dragend", (e) => {
      const { box } = (e as CustomEvent).detail;
      this.move(box.x, box.y);
    });

    this.group.on("mouseenter", () => {
      this.graph.emit(EVENT_MOUSEOVER, { item: this });
    });

    this.group.on("mouseleave", () => {
      this.graph.emit(EVENT_MOUSEOUT, { item: this });
    });

    this.group.on("click", (event) => {
      this.graph.emit(EVENT_SELECT, { item: this });
      event.stopPropagation();
    });
  }

  move(x: number, y: number) {
    this.x = x ?? this.x;
    this.y = y ?? this.y;
    this.groupRect?.move(this.x, this.y);
    childrenPostion(this.children, this.x, this.y);
    this.emit(EVENT_LINE_UPDATE);
  }

  setWidth(width: number): void {
    this.width = width;
    this.groupRect?.setWidth(this.width);
  }

  setHeight(height: number): void {
    this.height = height;
    this.groupRect?.setHeight(this.height);
  }

  arrangeChildren() {
    const { width, height } = getWidthAndHeight(this.children);
    this.setHeight(height);
    this.setWidth(width);
    const { x, y } = this.boundary;
    childrenPostion(this.children, x, y);
    setChildrenWidth(this.children, this.width);
    this.children.forEach((child) => {
      child.emit(EVENT_LINE_UPDATE);
    });
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

    this.arrangeChildren();
  }

  removeChildren(child: TKeyvalueBox) {
    this.children.delete(child);
    this.arrangeChildren();
    this.line?.update();
  }

  get line() {
    return this._line;
  }

  set line(line: TLine | null) {
    this._line = line;
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

  layout() {
    layoutTree(this);
  }

  delete() {
    if (this.line) this.unlink();
    this.children.forEach((child) => {
      child.delete();
    });
    this.groupRect?.delete();
    this.groupRect = undefined;
    this.graph.objectBoxes.delete(this);
  }

  front() {
    this.groupRect?.front();
    this.children.forEach((child) => {
      child.front();
    });
  }

  highlight() {
    this.groupRect?.highlight();
  }

  unHighlight() {
    this.groupRect?.unHighlight();
  }

  get container() {
    return this.groupRect?.container;
  }

  get group() {
    return this.groupRect?.group;
  }
}
