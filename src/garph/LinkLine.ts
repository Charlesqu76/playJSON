import { Svg } from "@svgdotjs/svg.js";
import { Box } from "./box";
import KeyValueBox from "./KeyValueBox";
import ObjectBox from "./ObjectBox";
import Line from "./Line";

export default class LinkLine extends Line {
  keyValueBox: KeyValueBox;
  objectBox: ObjectBox;
  private keydownHandler: (event: KeyboardEvent) => void;

  constructor(draw: Svg, start: KeyValueBox, end: ObjectBox, options = {}) {
    super(draw, options);
    this.keyValueBox = start;
    this.objectBox = end;
    this.path.plot(this.getControlPoints(start, end));

    this.keydownHandler = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === "Delete" || event.key === "Backspace") &&
        Line.lastClickedLine === this
      ) {
        this.remove();
      }
    };
    document.addEventListener("keydown", this.keydownHandler);
  }

  remove = () => {
    document.removeEventListener("keydown", this.keydownHandler);
    if (Line.lastClickedLine === this) {
      Line.lastClickedLine = null;
    }
    this.objectBox.setParent(null);
    this.keyValueBox.child = null;
    this.path.remove();
    this.keyValueBox.line = null;
  };

  getControlPoints = (start: Box, end: Box) => {
    const { curveHeight } = this.settings;
    const { x, y, width, height } = start.boundary;
    const { x: ex, y: ey, width: ewidth, height: eheight } = end.boundary;
    const controlPoint1 = {
      x: x + (ex - x) / 3,
      y: y + height / 2 - curveHeight,
    };
    const controlPoint2 = {
      x: x + (2 * (ex - x)) / 3,
      y: ey + eheight / 2 - curveHeight,
    };

    return `
              M${x + width},${y + height / 2} 
              C${controlPoint1.x},${controlPoint1.y} 
              ${controlPoint2.x},${controlPoint2.y} 
              ${ex},${ey + eheight / 2}
          `;
  };

  update = (start: Box, end: Box) => {
    console.log("update");
    this.path.plot(this.getControlPoints(start, end));
  };
}
