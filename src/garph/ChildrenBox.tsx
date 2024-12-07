import { Svg } from "@svgdotjs/svg.js";
import DraggableRect from "./DraggableRect";
import NormalRect from "./NormalReact";
import { Box } from "./box";
import Graph, { EVENT_UPDATE } from "./graph";

const padding = 5;
const gap = 3;

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
  config?: {
    ActiveStrokeColor?: string;
    padding?: number;
  };
}

export default class ChildrenBox<T extends NormalRect>
  extends DraggableRect
  implements Box
{
  children: Set<T> = new Set([]);
  constructor(draw: Svg, props: Props, graph: Graph) {
    super(draw, props, graph);
    this.initEvent();
  }

  initEvent = () => {
    this.rect.on("dragmove", (event) => {
      const { box } = (event as CustomEvent).detail;
      this.move(box.x, box.y);
    });
  };

  getWidth = () =>{
    
  }

  addChildren(child: T | T[]) {
    if (!Array.isArray(child)) {
      child = [child];
    }
    child.forEach((c) => {
      this.children.add(c);
      c.setParent(this);
    });

    this.move(this.boundary.x, this.boundary.y);
    this.setWidth();
    this.setHeight();
    this.graph.eventEmitter.emit(EVENT_UPDATE, { name: "addChildren" });
  }

  removeChildren(child: T) {
    this.children.delete(child);
    child.setParent(null);
    this.move(this.boundary.x, this.boundary.y);
    this.setWidth();
    this.setHeight();
    this.graph.eventEmitter.emit(EVENT_UPDATE, { name: "removeChildren" });
  }

  setWidth = () => {
    if (this.children.size === 0) {
      this.rect.width(100);
      return;
    }
    let width = 0;
    this.children.forEach((child) => {
      width = Math.max(width, child.boundary.width);
    });

    this.rect.width(width + padding * 2);
  };

  setHeight = () => {
    if (this.children.size === 0) {
      this.rect.height(30);
      return;
    }
    let height = 0;
    this.children.forEach((child) => {
      height += child.boundary.height;
    });
    this.rect.height(height + padding * 2 + gap * (this.children.size - 1));
  };

  move = (x: number, y: number) => {
    this.rect.move(x, y);
    Array.from(this.children).reduce((acc, cur) => {
      cur.move(x + padding, acc + padding);
      acc += cur.boundary.height + gap;
      return acc;
    }, y);
    this.eventEmitter.emit("move");
  };

  delete = () => {
    // this.rect.remove();
  };

  show = () => {
    this.rect.show();
    this.children.forEach((child) => {
      child.show();
    });
  };

  hide = () => {
    this.rect.hide();
    this.children.forEach((child) => {
      child.hide();
    });
  };
}
