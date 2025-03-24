import KeyValueBox from "./keyvalueBox";
import Graph from ".";
import ChildrenBox from "./basic/ChildrenBox";
import LinkLine from "./LinkLine";
import {
  EVENT_CREATE,
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
    const children = Object.entries(value).map(
      ([key, value]) =>
        new KeyValueBox(
          {
            x: 0,
            y: 0,
            key: key,
            value: value,
          },
          graph
        )
    );

    super({ children, x, y }, graph);
    this.graph.emit(EVENT_CREATE, { item: this });
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

  addChildren(children: KeyValueBox | KeyValueBox[]): void {
    super.addChildren(children);
    this.graph.emit(EVENT_UPDATE, { name: "addChildren" });
    this.line?.update();
  }

  removeChildren(child: KeyValueBox): void {
    this.graph.emit(EVENT_UPDATE, { name: "removeChildren" });
    super.removeChildren(child);
    this.line?.update();
  }

  link(line: LinkLine, keyValueBox: KeyValueBox) {
    this.line = line;
    this.setParent(keyValueBox);
  }

  unlink() {
    this.line = null;
    this.setParent(null);
  }

  delete() {
    this.graph.emit(EVENT_UPDATE, { name: "deleteObjectBox" });
    super.delete();
    this.line?.delete();
  }
}
