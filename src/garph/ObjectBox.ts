import { Svg } from "@svgdotjs/svg.js";
import KeyValueBox from "./KeyValueBox";
import Graph from "./graph";
import ChildrenBox from "./ChildrenBox";
interface Props {
  x: number;
  y: number;
  value: Object;
}

export default class ObjectBox extends ChildrenBox<KeyValueBox> {
  isArray = false;
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
    });

    // Add keyboard event listeners
    document.addEventListener("keydown", (e) => {
      if (!this.isHovered) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        this.handleCopy();
      }
    });

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
  }

  private handleCopy() {
    const jsonStr = JSON.stringify(this.value);
    navigator.clipboard.writeText(jsonStr).catch((err) => {
      console.error("Failed to copy:", err);
    });
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

  // move(x: number, y: number) {
  //   // Assuming there's an existing move method
  //   // ...existing move logic...
  //   this.emit('move');
  //   this.eventEmitter.emit('move');
  // }

  // on(event: string, handler: Function) {
  //   this.eventEmitter.on(event, handler);
  // }

  // off(event: string, handler: Function) {
  //   this.eventEmitter.off(event, handler);
  // }
}
