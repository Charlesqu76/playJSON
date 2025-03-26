import Box from "./index";
import Graph from "..";
import {
  childrenPostion,
  getHeight,
  getWidth,
  setChildrenWidth,
} from "@/graph/utils/ChildBox";
import { TKeyvalueBox } from "./KeyValueBox";
import GroupRect from "./GroupRect";
import { EVENT_LINE_UPDATE } from "../basic/Line";

interface Props {
  x: number;
  y: number;
  children: any[];
}

export default class ChildrenBox extends Box {
  groupRect?: GroupRect;
  children: Set<TKeyvalueBox> = new Set([]);
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

    if (!this.group) {
      this.init();
    } else {
      this.move(this.x, this.y);
    }
  }

  init() {
    if (!this.graph?.canvas) return;
    this.groupRect = new GroupRect(
      {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      },
      this.graph
    );

    childrenPostion(this.children, this.x, this.y);
    setChildrenWidth(this.children, this.width);

    this.children.forEach((child) => {
      child.group && this.group?.add(child.group);
    });
    this.group?.on("dragend", (e) => {
      const { box } = (e as CustomEvent).detail;
      this.move(box.x, box.y);
    });

    this.group?.on("dragmove", (e) => {
      this.emit(EVENT_LINE_UPDATE);
      this.children.forEach((child) => {
        child.emit(EVENT_LINE_UPDATE);
      });
    });
  }

  get container() {
    return this.groupRect?.container;
  }

  get group() {
    return this.groupRect?.group;
  }

  move(x: number, y: number) {
    this.x = x ?? this.x;
    this.y = y ?? this.y;
    this.group?.move(this.x, this.y);
    childrenPostion(this.children, this.x, this.y);
    this.emit(EVENT_LINE_UPDATE);
  }

  arrangeChildren() {
    this.width = getWidth(this.children);
    this.height = getHeight(this.children);
    this.container?.setWidth(this.width);
    this.container?.setHeight(this.height);
    const { x, y } = this.boundary;
    childrenPostion(this.children, x, y);
    setChildrenWidth(this.children, this.width);
  }

  addChildren(children: TKeyvalueBox | TKeyvalueBox[]) {
    if (!Array.isArray(children)) {
      children = [children];
    }
    children.forEach((child) => {
      if (this.group && child.group) {
        this.group.add(child.group);
      }
      this.children.add(child);
      // @ts-ignore
      child.setParent(this);
      // child.changeMode();
    });
    this.arrangeChildren();
  }

  removeChildren(child: TKeyvalueBox) {
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
