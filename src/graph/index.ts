import { SVG } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";
import "@svgdotjs/svg.panzoom.js";
import ObjectBox, { TObjectBox } from "./basic2/ObjectBox";
import { Svg } from "@svgdotjs/svg.js";
import { layoutTree } from "./utils/layout";
import EventEmitter from "./utils/EventEmitter";
import { EVENT_SELECT } from "@/graph/event";
import keydown from "./event/keydown";

import { events } from "./event/index";
import { TKeyvalueBox } from "./basic2/KeyValueBox";
import { TLink } from "./basic2/Link";
import { TLine } from "./basic/Line";

interface IProps {
  zoomCallback?: (zoom: number) => void;
  valueChanged?: (value: any) => void;
  json?: object | object[];
}

class Graph extends EventEmitter {
  container: HTMLElement | null = null;
  canvas: Svg | null = null;
  zoomCallback: ((zoom: number) => void) | null = null;
  valueChanged: ((value: any) => void) | null = null;
  objectBoxes: TObjectBox[] = [];
  keyValueBoxes: TKeyvalueBox[] = [];
  linkLines: WeakSet<TLink> = new WeakSet([]);
  selectedItem: TLine | TKeyvalueBox | TObjectBox | null = null;
  mouseX: number = 0;
  mouseY: number = 0;
  isLinking: boolean = false;
  isKeyvvalueBoxMoving: boolean = false;

  constructor(props: IProps) {
    super();
    const { zoomCallback, valueChanged, json } = props || {};
    this.zoomCallback = zoomCallback || null;
    this.valueChanged = valueChanged || null;
  }

  initCanvas = (id: string | HTMLElement) => {
    this.container = id as HTMLElement;
    if (typeof id === "string") {
      this.container = document.querySelector(id);
    }
    if (!this.container) return;

    this.container.style.position = "relative";

    const { width, height } = this.container.getBoundingClientRect();
    this.canvas = SVG()
      .addTo(id)
      .size("100%", "100%")
      .viewbox(`0 0 ${width} ${height}`)
      .panZoom({ zoomMin: 0.1, zoomMax: 5 });

    this.initEvent();
  };

  initEvent = () => {
    if (!this.canvas) return;

    document.addEventListener("keydown", (e) => {
      keydown(e, this);
    });

    document.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    events(this);
  };

  initData = (data: Object | Object[]) => {
    if (!Array.isArray(data)) {
      data = [data];
    }
    (data as object[]).forEach((item) => {
      if (this.canvas === null) return;
      new ObjectBox(
        {
          x: 100,
          y: 0,
          value: item,
        },
        this
      );
    });
  };

  layout = () => {
    this.getAllIsolateObjectBox().forEach((box) => {
      layoutTree(box);
    });

    this.getAllIsolateObjectBox().forEach((box) => {
      box.render();
    });
  };

  addObjectBox = (box: TObjectBox) => {
    this.objectBoxes.push(box);
  };

  addKeyValueBox = (box: TKeyvalueBox) => {
    this.keyValueBoxes.push(box);
  };

  addLinkLine = (linkline: TLink) => {
    this.linkLines.add(linkline);
  };

  getAllIsolateObjectBox = () => {
    return this.objectBoxes.filter((box) => !box.parent);
  };

  centerViewOn = (x: number, y: number) => {
    if (!this.canvas) return;
    const viewbox = this.canvas.viewbox();
    const newX = x - viewbox.width / 2;
    const newY = y - viewbox.height / 2;
    this.canvas
      .animate(200)
      .viewbox(newX, newY, viewbox.width, viewbox.height)
      .zoom(0.8);
  };

  findMatchingObjects = (searchText: string) => {
    if (!searchText.trim()) return null;

    const match = this.keyValueBoxes.find((box) => {
      const keyValue = box.key;
      const valueValue = box.value;
      if (typeof valueValue === "string") {
        return valueValue.includes(searchText) || keyValue.includes(searchText);
      }
      return keyValue.includes(searchText);
    });

    if (!match) return null;

    this.emit(EVENT_SELECT, { item: match });

    const { x, y } = match.boundary;
    this.centerViewOn(x, y);

    return null;
  };

  get value() {
    const values = this.getAllIsolateObjectBox().map((item) => item.value);
    return values;
  }

  get zoom() {
    if (!this.canvas) return 1;
    return this.canvas.zoom();
  }

  get viewpoint() {
    if (!this.canvas) return { x: 0, y: 0, width: 1000, height: 1000 };
    const viewbox = this.canvas.viewbox();
    return {
      x: viewbox.x,
      y: viewbox.y,
      width: viewbox.width,
      height: viewbox.height,
    };
  }
}

export default Graph;
