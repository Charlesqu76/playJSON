import DraggableRect from "./DraggableRect";
import { Box } from "./box";
import Graph from "..";
import { EVENT_MOVE } from "@/graph/event";
import NormalRect from "./NormalReact";

const PADDING_X = 5;
const PADDING_Y = 5;
const GAP = 5;
const MIN_WIDTH = 100;

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default class ChildrenBox<C extends NormalRect<ChildrenBox<C, P>>, P>
  extends DraggableRect<P>
  implements Box
{
  children: Set<C> = new Set([]);
  constructor(props: Props, graph: Graph) {
    super(props, graph);
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
      child.changeMode();
    });

    this.arrangeChildren();
  }

  removeChildren(child: C) {
    this.children.delete(child);
    child.setParent(null);
    this.arrangeChildren();
  }

  arrangeChildren() {
    this.setWidth();
    this.setHeight();
    const { x, y } = this.boundary;
    Array.from(this.children).reduce((acc, child) => {
      child.move(x + PADDING_X, acc + PADDING_Y);
      acc += child.boundary.height + GAP;
      return acc;
    }, y);
  }

  setWidth() {
    if (this.children.size === 0) {
      this.rect.width(MIN_WIDTH);
      return;
    }
    let width = 0;
    this.children.forEach((child) => {
      width = Math.max(width, child.realWidth);
    });

    this.children.forEach((child) => {
      child.rect.width(width);
    });

    this.rect.width(width + PADDING_X * 2);
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
    this.rect.height(height + PADDING_Y * 2 + GAP * (this.children.size - 1));
  }

  move(x: number, y: number) {
    super.move(x, y);
    this.arrangeChildren();
    this.emit(EVENT_MOVE);
  }

  front(): void {
    this.rect.front();
    this.children.forEach((child) => {
      child.front();
    });
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

  delete() {
    this.rect.remove();
    this.children.forEach((child) => child.delete());
  }
}
