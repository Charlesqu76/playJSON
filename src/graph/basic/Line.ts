import { Path } from "@svgdotjs/svg.js";
import Graph from "..";
import { TKeyvalueBox } from "../basic2/keyValueBox";
import { TObjectBox } from "../basic2/ObjectBox";
import {
  EVENT_MOUSEOUT,
  EVENT_MOUSEOVER,
  EVENT_SELECT,
  EVENT_UPDATE,
} from "@/graph/event";
import { getControlPoints } from "../utils";
import { Svg } from "@svgdotjs/svg.js";
import EventEmitter from "../utils/EventEmitter";
const defaultOptions = {
  curveHeight: 0,
  strokeColor: "black",
  strokeWidth: 2,
  showControlPoints: false,
};

export type TLine = Line;

export const EVENT_LINE_UPDATE = Symbol("EVENT_LINE_UPDATE");

export default class Line extends EventEmitter {
  keyValueBox: TKeyvalueBox;
  objectBox: TObjectBox;
  static lastClickedLine: Line | null = null;
  path: Path;
  settings = defaultOptions;
  graph: Graph;
  canvas: Svg;

  constructor(keyValueBox: TKeyvalueBox, objectBox: TObjectBox, graph: Graph) {
    super();
    if (!graph.canvas) {
      throw new Error("graph is required");
    }
    this.graph = graph;
    this.canvas = graph.canvas;
    this.keyValueBox = keyValueBox;
    this.objectBox = objectBox;
    this.settings = { ...defaultOptions };
    const { strokeColor, strokeWidth } = this.settings;
    this.path = this.canvas.path().fill("none").stroke({
      color: strokeColor,
      width: strokeWidth,
    });

    this.link();
    setTimeout(() => {
      this.update();
    }, 0);

    this.initEvent();
  }

  initEvent() {
    this.path.on("click", () => {
      this.graph.emit(EVENT_SELECT, { item: this });
    });

    this.path.on("mouseover", () => {
      this.graph.emit(EVENT_MOUSEOVER, { item: this });
    });

    this.path.on("mouseout", () => {
      this.graph.emit(EVENT_MOUSEOUT, { item: this });
    });
  }

  show() {
    this.path.show();
  }

  front() {
    this.path.front();
  }

  hide() {
    this.path.hide();
  }

  update = () => {
    // @ts-ignore
    this.path.plot(getControlPoints(this.keyValueBox, this.objectBox));
  };

  link() {
    this.keyValueBox.on(EVENT_LINE_UPDATE, this.update);
    this.objectBox.on(EVENT_LINE_UPDATE, this.update);
    this.objectBox.line = this;
    this.objectBox.parent = this.keyValueBox;
    this.keyValueBox.child = this.objectBox;
    // this.graph.emit(EVENT_UPDATE, { name: "link" });
  }

  unlink() {
    this.keyValueBox.off(EVENT_LINE_UPDATE, this.update);
    this.objectBox.off(EVENT_LINE_UPDATE, this.update);
    this.objectBox.line = null;
    this.objectBox.parent = null;
    this.keyValueBox.child = null;
    this.path.remove();
    this.graph.emit(EVENT_UPDATE, { name: "delete" });
    // this.graph.emit(EVENT_UPDATE, { name: "unlink" });
  }

  highlight() {
    this.front();
    this.path.stroke({ color: "red" });
  }

  unHighlight() {
    this.path.stroke({ color: this.settings.strokeColor });
  }
}
