import { Path } from "@svgdotjs/svg.js";
import { Svg } from "@svgdotjs/svg.js";
import { Box } from "./box";
import KeyValueBox from "./KeyValueBox";
import ObjectBox from "./ObjectBox";

export default class LinkLine {
  path: Path;
  settings: {
    curveHeight: number;
    strokeColor: string;
    strokeWidth: number;
    showControlPoints: boolean;
  };
  constructor(svg: Svg, start: KeyValueBox, end: ObjectBox, options = {}) {
    const defaultOptions = {
      curveHeight: 0,
      strokeColor: "green",
      strokeWidth: 4,
      showControlPoints: false,
    };

    this.settings = { ...defaultOptions, ...options };
    const { strokeColor, strokeWidth } = this.settings;
    this.path = svg.path().fill("none").stroke({
      color: strokeColor,
      width: strokeWidth,
    });

    this.path.plot(this.getControlPoints(start, end));
  }

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
    this.path.plot(this.getControlPoints(start, end));
  };

  hide = () => {
    this.path.hide();
  };

  show = () => {
    this.path.show();
  };
}
