import { Svg } from "@svgdotjs/svg.js";
import KeyValueBox from "./KeyValueBox";
import Graph from "./graph";
import ChildrenBox from "./basic/ChildrenBox";
import LinkLine from "./LinkLine";
import { EVENT_SELECT, EVENT_UPDATE } from "./event";
interface Props {
  x: number;
  y: number;
  value: Object;
}

/**
 * exact one parent - keyValueBox
 * children - KeyValueBox
 */

export default class ObjectBox extends ChildrenBox<KeyValueBox, KeyValueBox> {
  public isArray = false;
  protected line: LinkLine | null = null;

  constructor(draw: Svg, { x, y, value }: Props, graph: Graph) {
    super(
      draw,
      { x, y, width: 0, height: 0, config: { ActiveStrokeColor: "grey" } },
      graph
    );
    graph.addObjectBox(this);
    this.isArray = Array.isArray(value);
    if (this.isArray) {
      this.rect.fill("#dbeafe");
    } else {
      this.rect.fill("#f3e8ff");
    }

    const entries = Object.entries(value);
    const children = entries.map(([key, value], index) => {
      return new KeyValueBox(
        draw,
        {
          x: 0,
          y: 0,
          key: key,
          value: value,
        },
        graph,
        this
      );
    });
    this.addChildren(children);
    this.initEvent();
  }

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
      Object.assign(m, child.value);
    });
    return m;
  }

  addChildren(children: KeyValueBox | KeyValueBox[]): void {
    super.addChildren(children);
    this.line?.update();
    this.setWidth();
  }

  removeChildren(child: KeyValueBox): void {
    super.removeChildren(child);
    this.line?.update();
    this.setWidth();
  }

  setLine(line: LinkLine | null) {
    this.line = line;
  }

  initEvent = () => {
    this.rect.on("mouseover", () => {
      this.rect.attr({ stroke: "red", "stroke-width": 3 });
      this.front();
      this.children.forEach((child) => child.front());
    });

    this.rect.on("mouseout", () => {
      if (this.graph.selectedItem === this) {
        return;
      }
      this.rect.attr({ stroke: "none" });
    });

    this.rect.on("click", () => {
      this.graph.emit(EVENT_SELECT, { item: this });
    });
  };

  delete() {
    this.rect.remove();
    this.children.forEach((child) => child.delete());
    this.line?.delete();
    this.graph.emit(EVENT_UPDATE, { name: "deleteObjectBox" });
  }
}
