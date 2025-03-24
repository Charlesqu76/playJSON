import Box from "./index";
import Graph from "..";
import { G } from "@svgdotjs/svg.js";
import NormalRect from "../basic/NormalReact";

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
    width = Math.max(width, child.width);
  });

  return width + PADDING_X * 2;
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

function childrenPostion(children: Set<any>, x: number, y: number) {
  children.forEach((child) => {
    if (!child.group) {
      child.render(x + PADDING_X, y + PADDING_Y);
    } else {
      child.move(x + PADDING_X, y + PADDING_Y);
    }
    y += child.height + GAP;
  });
}
interface Props {
  x: number;
  y: number;
  children: any[];
}

export default class ChildrenBox extends Box {
  group?: G;
  children: Set<any> = new Set([]);
  container?: NormalRect<any>;
  constructor(props: Props, graph: Graph) {
    const { children } = props;
    const setChildren = new Set(children);
    const width = getWidth(setChildren);
    const height = getHeight(setChildren);
    super({ width, height, graph });
    this.children = setChildren;
  }

  render(x: number, y: number) {
    this.x = x ?? this.x;
    this.y = y ?? this.y;

    if (!this.graph?.canvas) return;
    this.group = this.graph.canvas.group();
    this.group?.draggable();

    this.container = new NormalRect(
      {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      },
      this.graph
    );
    this.container.rect.attr({
      stroke: "black",
      "stroke-width": 1,
      rx: 5,
      ry: 5,
    });
    childrenPostion(this.children, this.x, this.y);
    this.group.add(this.container.rect);
    this.addToGroup();
    this.group.on("dragend", (e) => {
      const { box } = (e as CustomEvent).detail;
      this.move(box.x, box.y);
    });
  }

  addToGroup() {
    if (!this.group) return;
    this.children.forEach((child) => {
      this.group?.add(child.group);
    });
  }

  arrangeChildren() {
    this.width = getWidth(this.children);
    this.height = getHeight(this.children);
    this.container?.setWidth(this.width);
    this.container?.setHeight(this.height);
    const { x, y } = this.boundary;
    childrenPostion(this.children, x, y);
  }

  addChildren(children: C | C[]) {
    if (!Array.isArray(children)) {
      children = [children];
    }
    children.forEach((child) => {
      if (this.group) {
        this.group.add(child.group);
      }
      this.children.add(child);
      child.setParent(this);
      // child.changeMode();
    });

    this.arrangeChildren();
  }

  move(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.group?.move(x, y);
    childrenPostion(this.children, x, y);
  }

  removeChildren(child: C) {
    this.children.delete(child);
    child.setParent(null);
    this.arrangeChildren();
  }

  front() {
    this.group?.front();
    this.container?.rect.front();
    this.children.forEach((child) => {
      child.front();
    });
  }
}
