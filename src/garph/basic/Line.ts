import { Path } from "@svgdotjs/svg.js";
import { Svg } from "@svgdotjs/svg.js";

const defaultOptions = {
  curveHeight: 0,
  strokeColor: "black",
  strokeWidth: 4,
  showControlPoints: false,
};

export default class Line {
  static lastClickedLine: Line | null = null;
  draw: Svg;
  path: Path;
  settings = defaultOptions;

  constructor(draw: Svg, options = {}) {
    this.draw = draw;
    this.settings = { ...defaultOptions, ...options };
    const { strokeColor, strokeWidth } = this.settings;
    this.path = this.draw.path().fill("none").stroke({
      color: strokeColor,
      width: strokeWidth,
    });

    this.initEvent();
  }

  initEvent() {
    // this.path.on("click", (event) => {
    //   this.path.front();
    //   event.stopPropagation();
    //   if (Line.lastClickedLine && Line.lastClickedLine !== this) {
    //     Line.lastClickedLine.unselect();
    //   }
    //   this.path.stroke({ color: "red" });
    //   Line.lastClickedLine = this;
    // });

    this.path.on("mouseover", () => {
      this.path.attr({ cursor: "pointer" });
    });

    this.path.on("mouseout", () => {
      this.path.attr({ cursor: "default" });
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
