// src/main.ts
import { SVG } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";
import "@svgdotjs/svg.panzoom.js";

import ObjectBox from "./ObjectBox";
import { bfs } from "./bfs";
import { Svg } from "@svgdotjs/svg.js";
import KeyValueBox from "./KeyValueBox";
import LinkLine from "./LinkLine";
import Line from "./Line";

class Graph {
  private mouseX = 0;
  private mouseY = 0;
  canvas: Svg | null = null;
  private onZoomCallback: ((zoom: number) => void) | null = null;
  node: ObjectBox | null = null;
  objectBoxes: ObjectBox[] = [];
  keyValueBoxes: KeyValueBox[] = [];
  linkLines: WeakSet<LinkLine> = new WeakSet([]);
  constructor() {}

  private async handlePaste() {
    // try {
    //   const text = await navigator.clipboard.readText();
    //   const value = JSON.parse(text);
    //   new ObjectBox(
    //     this.canvas,
    //     {
    //       x: this.mouseX,
    //       y: this.mouseY,
    //       value: value,
    //     },
    //     this
    //   );
    // } catch (err) {
    //   console.error("Failed to paste:", err);
    // }
  }

  initCanvas = (id: string) => {
    this.canvas = SVG()
      .addTo(id)
      .size("100%", "100%")
      .viewbox("0 0 1000 1000")
      // .panZoom({ zoomMin: 0.1, zoomMax: 5 });

    // Track mouse position
    // this.canvas.node.addEventListener("mousemove", (e) => {
    //   console.log("asdfasdf");
    //   const rect = this.canvas?.node.getBoundingClientRect();
    //   this.mouseX = e.clientX - rect.left;
    //   this.mouseY = e.clientY - rect.top;
    // });

    // // Add paste handler to SVG element
    // this.canvas.node.addEventListener("keydown", (e) => {
    //   console.log("asdfasdf");
    //   if ((e.ctrlKey || e.metaKey) && e.key === "v") {
    //     this.handlePaste();
    //   }
    // });

    // Make SVG focusable
    this.canvas.node.setAttribute("tabindex", "0");

    this.canvas.node.addEventListener("click", () => {
      if (Line.lastClickedLine) {
        Line.lastClickedLine.unselect();
        Line.lastClickedLine = null;
      }
    });

    this.canvas.on("zoom", (event: any) => {
      if (this.onZoomCallback) {
        this.onZoomCallback(event.detail.level);
      }
    });
  };

  setZoomCallback = (callback: (zoom: number) => void) => {
    this.onZoomCallback = callback;
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

  addObjectBox = (box: ObjectBox) => {
    this.objectBoxes.push(box);
  };

  addKeyValueBox = (box: KeyValueBox) => {
    this.keyValueBoxes.push(box);
  };

  allChildrenBox = () => {
    return this.objectBoxes;
  };

  getAllIsolateBox = () => {
    return this.objectBoxes.filter((box) => !box.parent);
  };

  addLinkLine = (linkline: LinkLine) => {
    this.linkLines.add(linkline);
  };

  getZoom = (): number => {
    if (!this.canvas) return 1;
    return this.canvas.zoom();
  };

  getViewpoint = () => {
    if (!this.canvas) return { x: 0, y: 0, width: 1000, height: 1000 };
    const viewbox = this.canvas.viewbox();
    return {
      x: viewbox.x,
      y: viewbox.y,
      width: viewbox.width,
      height: viewbox.height,
    };
  };
}

export default Graph;
