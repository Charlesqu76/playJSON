import { Path } from "@svgdotjs/svg.js";
import Graph from "..";
import { Svg } from "@svgdotjs/svg.js";
import { TKeyvalueBox } from "../component/keyValueBox";
import { TObjectBox } from "../component/ObjectBox";
import { EVENT_MOUSEOUT, EVENT_MOUSEOVER, EVENT_SELECT } from "../event";
import EventEmitter from "../utils/EventEmitter";
import { getControlPoints } from "../utils/line";
const defaultOptions = {
  curveHeight: 0,
  strokeColor: "black",
  strokeWidth: 3,
  showControlPoints: false,
};

export type TLine = Line;

export const EVENT_LINE_UPDATE = Symbol("EVENT_LINE_UPDATE");

export default class Line extends EventEmitter {
  keyValueBox: TKeyvalueBox;
  objectBox: TObjectBox;
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

    this.path.attr({ cursor: "pointer" });

    this.link();
    this.update();
    this.initEvent();
  }

  initEvent() {
    this.path.on("click", () => {
      this.graph.emit(EVENT_SELECT, { item: this });
    });

    // this.path.on("mouseover", () => {
    //   this.graph.emit(EVENT_MOUSEOVER, { item: this });
    // });

    // this.path.on("mouseout", () => {
    //   this.graph.emit(EVENT_MOUSEOUT, { item: this });
    // });
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

  private update = () => {
    const p = getControlPoints(this.keyValueBox, this.objectBox);
    if (!p) return;
    this.path.plot(p);
  };

  link() {
    this.keyValueBox.on(EVENT_LINE_UPDATE, this.update);
    this.objectBox.on(EVENT_LINE_UPDATE, this.update);
    this.objectBox.line = this;
    this.objectBox.parent = this.keyValueBox;
    this.keyValueBox.child = this.objectBox;
  }

  unlink() {
    this.keyValueBox.off(EVENT_LINE_UPDATE, this.update);
    this.objectBox.off(EVENT_LINE_UPDATE, this.update);
    this.objectBox.line = null;
    this.objectBox.parent = null;
    this.keyValueBox.child = null;
    this.path.remove();
  }

  highlight() {
    this.front();
    this.path.stroke({ color: "red" });
  }

  unHighlight() {
    this.path.stroke({ color: this.settings.strokeColor });
  }
}
