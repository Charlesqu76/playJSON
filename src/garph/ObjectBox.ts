import { Svg } from "@svgdotjs/svg.js";
import KeyValueBox from "./keyvalueBox";
import Graph from "./graph";
import ChildrenBox from "./basic/ChildrenBox";
import LinkLine from "./LinkLine";
import {
  EVENT_MOUSEOUT,
  EVENT_MOUSEOVER,
  EVENT_SELECT,
  EVENT_UPDATE,
} from "./event";
interface Props {
  x: number;
  y: number;
  value: Object;
}

const OBJECT_COLOR = "#f3e8ff";
const ARRAY_COLOR = "#dbeafe";

/**
 * exact one parent - keyValueBox
 * children - KeyValueBoxes
 */

export default class ObjectBox extends ChildrenBox<KeyValueBox, KeyValueBox> {
  isArray = false;
  protected line: LinkLine | null = null;
  defaultStyle = {
    fill: OBJECT_COLOR,
    stroke: "black",
    "stroke-width": 1,
    rx: 5,
    ry: 5,
  };

  constructor({ x, y, value }: Props, graph: Graph) {
    super({ x, y, width: 0, height: 0 }, graph);
    graph.addObjectBox(this);
    this.isArray = Array.isArray(value);
    this.rect.attr({
      ...this.defaultStyle,
      fill: this.isArray ? ARRAY_COLOR : OBJECT_COLOR,
    });

    Object.entries(value).forEach(([key, value]) => {
      const keyValueBox = new KeyValueBox(
        {
          x: 0,
          y: 0,
          key: key,
          value: value,
        },
        graph,
        this
      );
      this.addChildren(keyValueBox);
    });
    this.initEvent();
  }

  initEvent = () => {
    this.rect.on("mouseover", () => {
      this.graph.emit(EVENT_MOUSEOVER, { item: this });
    });

    this.rect.on("mouseout", () => {
      this.graph.emit(EVENT_MOUSEOUT, { item: this });
    });

    this.rect.on("click", () => {
      this.graph.emit(EVENT_SELECT, { item: this });
    });
  };

  get value() {
    if (this.isArray) {
      const m = [] as any;
      this.children.forEach((child) => {
        m.push(Object.values(child.value)[0]);
      });
      return m;
    }
    const m = {};
    this.children.forEach((child) => {
      Object.assign(m, child.entry);
    });
    return m;
  }

  addChildren(children: KeyValueBox | KeyValueBox[]): void {
    super.addChildren(children);
    this.line?.update();
    this.graph.emit(EVENT_UPDATE, { name: "addChildren" });
  }

  removeChildren(child: KeyValueBox): void {
    super.removeChildren(child);
    this.line?.update();
    this.graph.emit(EVENT_UPDATE, { name: "removeChildren" });
  }

  setLine(line: LinkLine | null) {
    this.line = line;
  }

  delete() {
    super.delete();
    this.line?.delete();
    this.graph.emit(EVENT_UPDATE, { name: "deleteObjectBox" });
  }
}
