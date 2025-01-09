import { Svg } from "@svgdotjs/svg.js";
import DraggableRect from "./DraggableRect";
import { Box } from "./box";
import Graph from "../graph";
import { EVENT_MOVE, EVENT_UPDATE } from "@/garph/event";
import NormalRect from "./NormalReact";

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

export default class ChildrenBox<C extends NormalRect<ChildrenBox<C, P>>, P>
  extends DraggableRect<P>
  implements Box
{
  children: Set<C> = new Set([]);
  constructor(draw: Svg, props: Props, graph: Graph) {
    super(draw, props, graph);
    this.initEvent();
  }

  initEvent = () => {
    this.rect.on(
      "dragmove",
      (event) => {
        const { box } = (event as CustomEvent).detail;
        this.move(box.x, box.y);
      },
      { passive: true }
    );
  };

  addChildren(children: C | C[]) {
    if (!Array.isArray(children)) {
      children = [children];
    }
    children.forEach((child) => {
      this.children.add(child);
      child.setParent(this);
    });

    this.setWidth();
    this.setHeight();
    this.arrangeChildren();
    this.graph.emit(EVENT_UPDATE, { name: "addChildren" });
  }

  removeChildren(child: C) {
    this.children.delete(child);
    child.setParent(null);
    this.setWidth();
    this.setHeight();
    this.arrangeChildren();
    this.graph.emit(EVENT_UPDATE, { name: "removeChildren" });
  }

  arrangeChildren() {
    const { x, y } = this.boundary;
    Array.from(this.children).reduce((acc, child) => {
      child.move(x + padding, acc + padding);
      acc += child.boundary.height + gap;
      return acc;
    }, y);
  }

  setWidth() {
    if (this.children.size === 0) {
      this.rect.width(100);
      return;
    }
    let width = 0;
    this.children.forEach((child) => {
      width = Math.max(width, child.boundary.width);
    });

    this.rect.width(width + padding * 2);
  }

  setHeight() {
    if (this.children.size === 0) {
      this.rect.height(30);
      return;
    }
    let height = 0;
    this.children.forEach((child) => {
      height += child.boundary.height;
    });
    this.rect.height(height + padding * 2 + gap * (this.children.size - 1));
  }

  move(x: number, y: number) {
    super.move(x, y);
    this.arrangeChildren();
    this.emit(EVENT_MOVE);
  }

  show() {
    this.rect.show();
    this.children.forEach((child) => {
      child.show();
    });
  }

  hide() {
    this.rect.hide();
    this.children.forEach((child) => {
      child.hide();
    });
  }
}
