import DraggableRect from "./DraggableRect";
import { Box } from "./box";
import Graph from "..";
import { EVENT_MOVE } from "@/graph/event";
import NormalRect from "./NormalReact";

const PADDING_X = 5;
const PADDING_Y = 5;
const GAP = 5;
const MIN_WIDTH = 100;

function getWidth(children: Set<any>) {
  if (children.size === 0) {
    return MIN_WIDTH;
  }
  let width = 0;
  children.forEach((child) => {
    width = Math.max(width, child.realWidth);
  });

  return width;

  // children.forEach((child) => {
  //   child.rect.width(width);
  // });

  // this.rect.width(width + PADDING_X * 2);
}

function getHeight(children: Set<any>) {
  if (children.size === 0) {
    return 30;
  }
  let height = 0;
  children.forEach((child) => {
    height += child.height;
  });
  return height + PADDING_Y * 2 + GAP * (children.size - 1);
}
interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
  children: any[];
}

export default class ChildrenBox<C extends NormalRect<ChildrenBox<C, P>>, P>
  extends DraggableRect<P>
  implements Box
{
  group: any;
  children: Set<C> = new Set([]);
  constructor(props: Props, graph: Graph) {
    const { children } = props;
    const setChildren = new Set(children);
    const width = getWidth(setChildren);
    const height = getHeight(setChildren);
    super({ ...props, width, height }, graph);
    this.initEvent();
    this.children = setChildren;
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
    const width = getWidth(this.children);
    this.children.forEach((child) => {
      child.rect.width(width);
    });

    this.rect.width(width + PADDING_X * 2);
  }

  setHeight() {
    const height = getHeight(this.children);
    this.rect.height(height);
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
