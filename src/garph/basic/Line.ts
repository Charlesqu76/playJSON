import { Path } from "@svgdotjs/svg.js";
import { Svg } from "@svgdotjs/svg.js";
import Graph from "../graph";

const defaultOptions = {
  curveHeight: 0,
  strokeColor: "black",
  strokeWidth: 2,
  showControlPoints: false,
};

export default class Line {
  static lastClickedLine: Line | null = null;
  path: Path;
  graph: Graph;
  settings = defaultOptions;

  constructor(options = {}, graph: Graph) {
    this.graph = graph;
    this.settings = { ...defaultOptions, ...options };
    const { strokeColor, strokeWidth } = this.settings;
    this.path = this.graph.canvas.path().fill("none").stroke({
      color: strokeColor,
      width: strokeWidth,
    });
  }

  hide() {
    this.path.hide();
  }

  show() {
    this.path.show();
  }

  front() {
    this.path.front();
  }

  select() {
    this.path.stroke({ color: "red" });
  }

  unselect() {
    this.path.stroke({ color: this.settings.strokeColor });
  }
}
