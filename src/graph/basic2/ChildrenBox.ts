import Box from "./index";
import Graph from "..";
import DraggableRect from "../basic/DraggableRect";

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
  children: any[];
}

export default class ChildrenBox extends Box {
  group: any;
  children: Set<any> = new Set([]);
  container?: DraggableRect<any>;
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

    if (!this.graph) return;
    this.container = new DraggableRect(
      {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      },
      this.graph
    );
    this.children.forEach((child) => {
      child.render(x, y);
      y += child.height + GAP;
    });
  }
}
