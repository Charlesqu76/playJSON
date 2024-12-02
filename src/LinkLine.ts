import { Path } from "@svgdotjs/svg.js";
import { Svg } from "@svgdotjs/svg.js";

export default class LinkLine {
  path: Path;
  settings: {
    curveHeight: number;
    strokeColor: string;
    strokeWidth: number;
    showControlPoints: boolean;
  };
  constructor(
    svg: Svg,
    start: { x: number; y: number },
    end: { x: number; y: number },
    options = {}
  ) {
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

  getControlPoints = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const { curveHeight } = this.settings;
    const controlPoint1 = {
      x: start.x + (end.x - start.x) / 3,
      y: start.y - curveHeight,
    };
    const controlPoint2 = {
      x: start.x + (2 * (end.x - start.x)) / 3,
      y: end.y - curveHeight,
    };

    return `
              M${start.x},${start.y} 
              C${controlPoint1.x},${controlPoint1.y} 
              ${controlPoint2.x},${controlPoint2.y} 
              ${end.x},${end.y}
          `;
  };

  update = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    this.path.plot(this.getControlPoints(start, end));
  };
}
