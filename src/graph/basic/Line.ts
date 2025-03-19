import { Path } from "@svgdotjs/svg.js";
import Graph from "..";
import Basic from "./basic";

const defaultOptions = {
  curveHeight: 0,
  strokeColor: "black",
  strokeWidth: 2,
  showControlPoints: false,
};

export default class Line extends Basic {
  static lastClickedLine: Line | null = null;
  path: Path;
  settings = defaultOptions;

  constructor(options = {}, graph: Graph) {
    super(graph);
    this.settings = { ...defaultOptions, ...options };
    const { strokeColor, strokeWidth } = this.settings;
    this.path = this.canvas.path().fill("none").stroke({
      color: strokeColor,
      width: strokeWidth,
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

  select() {
    this.path.stroke({ color: "red" });
  }

  unselect() {
    this.path.stroke({ color: this.settings.strokeColor });
  }

  delete() {
    this.path.remove();
  }
}
