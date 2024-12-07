import { Svg } from "@svgdotjs/svg.js";
import KeyValueBox from "./KeyValueBox";
import Graph from "./graph";
import ChildrenBox from "./ChildrenBox";
import LinkLine from "./LinkLine";
interface Props {
  x: number;
  y: number;
  value: Object;
}

export default class ObjectBox extends ChildrenBox<KeyValueBox> {
  isArray = false;
  line: LinkLine | null = null;
  private isHovered = false;

  constructor(draw: Svg, { x, y, value }: Props, graph: Graph) {
    super(
      draw,
      { x, y, width: 0, height: 0, config: { ActiveStrokeColor: "grey" } },
      graph
    );
    graph.addObjectBox(this);
    this.rect.fill("grey");
    if (Array.isArray(value)) {
      this.isArray = true;
    }

    const entries = Object.entries(value);
    let previous = null as KeyValueBox | null;
    const children = entries.map(([key, value], index) => {
      const box = new KeyValueBox(
        draw,
        {
          x: x,
          y: (previous?.boundary.y ?? y) + (previous?.boundary.height ?? 0),
          key: key,
          value: value,
        },
        graph
      );
      previous = box;
      return box;
    });

    this.addChildren(children);

    this.graph.layout();

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

  private handleCopy() {
    const jsonStr = JSON.stringify(this.value);
    navigator.clipboard.writeText(jsonStr).catch((err) => {
      console.error("Failed to copy:", err);
    });
  }

  initEvent = () => {
    this.rect.on("mouseover", () => {
      this.isHovered = true;
      this.rect.attr({
        cursor: "grab",
        "stroke-width": 5,
        stroke: "grey",
      });
    });

    this.rect.on("mouseout", () => {
      this.isHovered = false;
      this.rect.attr({
        cursor: "normal",
        "stroke-width": 1,
        stroke: "none",
      });
    });

    this.rect.on("click", () => {
      // console.log("click");
      // if (this.graph.selectedItem !== this) {
      //   this.rect.attr({ "stroke-width": 1, stroke: "none" });
      // }
      // this.graph.selectedItem = this;
      // this.rect.attr({ "stroke-width": 3, stroke: "red" });
      // this.delete();
    });

    // Add keyboard event listeners
    document.addEventListener("keydown", (e) => {
      if (!this.isHovered) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        this.handleCopy();
      }
    });
  };
}
