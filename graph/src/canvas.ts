import { SVG } from "@svgdotjs/svg.js";
import { Svg } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";
import "@svgdotjs/svg.panzoom.js";
import Graph from ".";
const MAX_ZOOM = 2;
const MIN_ZOOM = 0.1;
export default class Canvas {
  canvas: Svg;
  container: HTMLElement | null = null;
  graph: Graph;

  constructor(id: string | HTMLElement, graph: Graph) {
    this.container = id as HTMLElement;
    this.graph = graph;
    if (typeof id === "string") {
      this.container = document.querySelector(id);
    }
    if (!this.container) throw new Error("Container not found");
    this.container.style.position = "relative";
    const { width, height } = this.container.getBoundingClientRect();

    this.canvas = SVG()
      .addTo(id)
      .size("100%", "100%")
      .viewbox(`0 0 ${width} ${height}`)
      .panZoom({ zoomMin: MIN_ZOOM, zoomMax: MAX_ZOOM, zoomFactor: 0.1 });
  }

  toCenter() {
    if (!this.canvas) return;
    const { width, height, x, y } = this.canvas.bbox();
    this.canvas.viewbox(x - width * 0.1, y, width * 1.2, height * 1.2);
  }
}
