import KeyValueBox, { TKeyvalueBox } from "./KeyValueBox";
import Graph from "..";
import ChildrenBox from "./ChildrenBox";
import {
  EVENT_CREATE,
  EVENT_MOUSEOUT,
  EVENT_MOUSEOVER,
  EVENT_SELECT,
} from "../event";
import { highlightRect, unHighlightRect } from "../utils/rect";
import Line, { TLine } from "../basic/Line";
import { layoutTree } from "../utils/layout";

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

export default class ObjectBox extends ChildrenBox {
  isArray = false;
  line: TLine | null = null;
  parent: TKeyvalueBox | null = null;

  constructor({ x, y, value, parent = null }: Props, graph: Graph) {
    const isArray = Array.isArray(value);
    const children = Object.entries(value).map(
      ([key, value]) =>
        new KeyValueBox(
          {
            isArray: isArray,
            key: key,
            value: value,
          },
          graph
        )
    );
    super({ children, x, y }, graph);
    this.isArray = isArray;
    this.parent = parent;
    children.forEach((child) => {
      child.parent = this;
    });

    this.graph.emit(EVENT_CREATE, { item: this });
  }

  get value() {
    if (this.isArray) {
      const m = [] as any;
      this.children.forEach((child) => {
        m.push(child.value);
      });
      return m;
    }
    const m = {};
    this.children.forEach((child) => {
      Object.assign(m, child.entry);
    });
    return m;
  }

  render(x: number = this.x, y: number = this.y) {
    super.render(x, y);
    this.parent && this.link(this.parent);
    this.container?.rect.attr({
      fill: this.isArray ? ARRAY_COLOR : OBJECT_COLOR,
    });

    if (!this.group) return;
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

  addChildren(children: TKeyvalueBox | TKeyvalueBox[]) {
    super.addChildren(children);
    if (!Array.isArray(children)) {
      children = [children];
    }

    children.forEach((child, index) => {
      if (this.group && child.group) {
        this.group.add(child.group);
      }
      this.children.add(child);
      child.setParent(this);
    });

    if (this.isArray) {
      let index = 0;
      this.children.forEach((child) => {
        child.keyBox.updateText(index.toString());
        index += 1;
      });
    }
    this.arrangeChildren();
  }

  removeChildren(children: TKeyvalueBox) {
    super.removeChildren(children);
    this.line?.update();
  }

  link(keyValueBox: TKeyvalueBox) {
    if (!keyValueBox) return;
    this.parent = keyValueBox;
    this.line = new Line(this.parent, this, this.graph);
  }

  unlink() {
    this.line?.unlink();
    this.line = null;
    this.parent = null;
  }

  delete() {
    if (this.line) {
      this.line.delete();
    }
    this.line = null;
    if (this.parent) {
      this.parent.child = null;
      this.parent = null;
    }
    this.children.forEach((child) => {
      child.delete();
    });
    this.groupRect?.delete();
    this.groupRect = undefined;
  }

  layout() {
    layoutTree(this);
  }
}
