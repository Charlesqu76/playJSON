import KeyValueBox from "./KeyValueBox";
import Graph from "..";
import ChildrenBox from "./ChildrenBox";
import LinkLine from "../LinkLine";

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

export default class ObjectBox extends ChildrenBox {
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
    graph.addObjectBox(this);
    this.isArray = isArray;
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
}

export type TObjectBox = ObjectBox;
