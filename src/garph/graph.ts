// src/main.ts
import { SVG } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";
import "@svgdotjs/svg.panzoom.js";

import ObjectBox from "./ObjectBox";
import { Svg } from "@svgdotjs/svg.js";
import KeyValueBox from "./KeyValueBox";
import LinkLine from "./LinkLine";
import Line from "./Line";
import { layoutTree } from "./layout";
import EventEmitter from "./EventEmitter";

export const UPDATE_TEXT = Symbol("updateText");

class Graph {
  eventEmitter: EventEmitter = new EventEmitter();
  canvas: Svg | null = null;
  private onZoomCallback: ((zoom: number) => void) | null = null;
  node: ObjectBox | null = null;
  objectBoxes: ObjectBox[] = [];
  keyValueBoxes: KeyValueBox[] = [];
  linkLines: WeakSet<LinkLine> = new WeakSet([]);
  private mouseX: number = 0;
  private mouseY: number = 0;

  constructor() {
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        this.handlePaste();
      }
    });

    document.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
  }

  private async handlePaste() {
    if (this.canvas === null) return;
    try {
      const svgPoint = (this.canvas.node as SVGSVGElement).createSVGPoint();
      svgPoint.x = this.mouseX;
      svgPoint.y = this.mouseY;
      const cursor = svgPoint.matrixTransform(
        (this.canvas.node as SVGSVGElement).getScreenCTM()?.inverse()
      );
      const text = await navigator.clipboard.readText();

      const value = JSON.parse(text);

      const newNode = new ObjectBox(
        this.canvas,
        {
          x: cursor.x,
          y: cursor.y,
          value: value,
        },
        this
      );
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  }

  initCanvas = (id: string) => {
    const container = document.querySelector(id);
    if (!container) return;

    this.eventEmitter.on(UPDATE_TEXT, () => {
      console.log("asdfasdfasdf");
    });

    const { width, height } = container.getBoundingClientRect();

    this.canvas = SVG()
      .addTo(id)
      .size("100%", "100%")
      .viewbox(`0 0 ${width} ${height}`)
      .zoom(1)
      .panZoom({ zoomMin: 0.1, zoomMax: 5 });

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
    layoutTree(this.node);
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

  // centerViewOn = (x: number, y: number) => {
  //   if (!this.canvas) return;
  //   const viewbox = this.canvas.viewbox();
  //   const newX = x - viewbox.width / 2;
  //   const newY = y - viewbox.height / 2;
  //   this.canvas.viewbox(newX, newY, viewbox.width, viewbox.height).zoom(0.8);
  // };

  // findMatchingObjects = (searchText: string) => {
  //   if (!searchText.trim()) return null;

  //   const match = this.keyValueBoxes.find((box) => {
  //     const value = box.valueValue;
  //     if (typeof value !== "string") return false;
  //     return value.toLowerCase().includes(searchText.toLowerCase());
  //   });

  //   if (!match) return null;

  //   const { x, y } = match.boundary;
  //   this.centerViewOn(x, y);

  //   return null;
  // };

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
