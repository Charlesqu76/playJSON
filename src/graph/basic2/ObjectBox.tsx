import KeyValueBox from "./KeyValueBox";
import Graph from "..";
import ChildrenBox from "./ChildrenBox";
import LinkLine from "../LinkLine";
import { EVENT_MOUSEOUT, EVENT_MOUSEOVER, EVENT_SELECT } from "../event";
import { highlightRect, unHighlightRect } from "../utils/rect";

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
export type TObjectBox = ObjectBox;

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
    children.forEach((child) => {
      child.parent = this;
    });
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

  render() {
    super.render(this.x, this.y);
    this.container?.rect.attr({
      fill: this.isArray ? ARRAY_COLOR : OBJECT_COLOR,
    });

    if (!this.group || !this.graph) return;
    this.group.on("mouseover", () => {
      this.graph.emit(EVENT_MOUSEOVER, { item: this });
    });

    this.group.on("mouseout", () => {
      this.graph.emit(EVENT_MOUSEOUT, { item: this });
    });

    this.group.on(
      "click",
      () => {
        this.graph.emit(EVENT_SELECT, { item: this });
      },
      { passive: true }
    );
    
    
  }
  highlight() {
    if (this.container) {
      highlightRect(this.container?.rect);
    }
  }
  unHighlight() {
    if (this.container) {
      unHighlightRect(this.container?.rect);
    }
  }
}
