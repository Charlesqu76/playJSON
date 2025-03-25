import KeyValueBox, { TKeyvalueBox } from "./KeyValueBox";
import Graph from "..";
import ChildrenBox from "./ChildrenBox";
import {
  EVENT_CREATE,
  EVENT_LINK,
  EVENT_MOUSEOUT,
  EVENT_MOUSEOVER,
  EVENT_SELECT,
} from "../event";
import { highlightRect, unHighlightRect } from "../utils/rect";
import { TLink } from "./Link";

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
  line: TLink | null = null;
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
    this.parent &&
      this.graph.emit(EVENT_LINK, {
        keyvalueBox: this.parent,
        objectBox: this,
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
    super.render(this.x, this.y);
    if (this.parent) {
      this.line?.render();
    }
    this.container?.rect.attr({
      fill: this.isArray ? ARRAY_COLOR : OBJECT_COLOR,
    });

    if (!this.group || !this.graph) return;
    this.group.on("mouseenter", () => {
      this.graph.emit(EVENT_MOUSEOVER, { item: this });
    });

    this.group.on("mouseleave", () => {
      this.graph.emit(EVENT_MOUSEOUT, { item: this });
    });

    this.group.on(
      "click",
      (event) => {
        this.graph.emit(EVENT_SELECT, { item: this });
        event.stopPropagation();
      },
      { passive: true }
    );
  }

  highlight() {
    if (this.container) {
      highlightRect(this.container?.rect);
    }
  }

  addChildren(children: TKeyvalueBox | TKeyvalueBox[]) {
    super.addChildren(children);
    this.line?.update();
  }

  removeChildren(children: TKeyvalueBox) {
    super.removeChildren(children);
    this.line?.update();
  }

  unHighlight() {
    if (this.container) {
      unHighlightRect(this.container?.rect);
    }
  }

  link(line: TLink, keyValueBox: TKeyvalueBox) {
    this.line = line;
    this.parent = keyValueBox;
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
}
