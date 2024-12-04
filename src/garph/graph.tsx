// src/main.ts
import { SVG } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";
import "@svgdotjs/svg.panzoom.js";

import ObjectBox from "./ObjectBox";
import { bfs } from "./bfs";
import { Svg } from "@svgdotjs/svg.js";

export class Graph {
  canvas: Svg | null = null;
  node: ObjectBox | null = null;
  objectBoxes: ObjectBox[] = [];
  constructor() {}

  initCanvas = (id: string) => {
    this.canvas = SVG().addTo(id).size("100%", "100%").viewbox("0 0 1000 1000");
  };

  initData = (data: Object) => {
    if (!this.canvas) return;
    this.node = new ObjectBox(
      this.canvas,
      {
        x: 100,
        y: 100,
        value: data,
      },
      this
    );
  };

  layout = () => {
    if (!this.node) return;
    bfs(this.node);
  };

  addChildBox = (box: ObjectBox) => {
    this.objectBoxes.push(box);
  };

  allChildrenBox = () => {
    return this.objectBoxes;
  };

  getAllIsolateBox = () => {
    return this.objectBoxes.filter((box) => !box.parent);
  };
}

export default Graph;
