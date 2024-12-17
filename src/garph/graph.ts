// src/main.ts
import { SVG } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";
import "@svgdotjs/svg.panzoom.js";
import ObjectBox from "./ObjectBox";
import { Svg } from "@svgdotjs/svg.js";
import KeyValueBox from "./KeyValueBox";
import LinkLine from "./LinkLine";
import { layoutTree } from "./layout";
import EventEmitter from "./EventEmitter";
import {
  EVENT_DELETE,
  EVENT_LINK,
  EVENT_UNLINK,
  EVENT_UPDATE,
  EVENT_SELECT,
} from "@/garph/event";
import debounce from "./utils/debounce";

class Graph extends EventEmitter {
  canvas: Svg | null = null;
  private onZoomCallback: ((zoom: number) => void) | null = null;
  private onValueUpdate: ((value: any) => void) | null = null;
  objectBoxes: ObjectBox[] = [];
  keyValueBoxes: KeyValueBox[] = [];
  linkLines: WeakSet<LinkLine> = new WeakSet([]);
  selectedItem: LinkLine | KeyValueBox | ObjectBox | null = null;
  private mouseX: number = 0;
  private mouseY: number = 0;

  constructor() {
    super();
  }

  initCanvas = (id: string | HTMLElement) => {
    let container: HTMLElement | null = id as HTMLElement;
    if (typeof id === "string") {
      container = document.querySelector(id);
    }
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
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
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "c") {
          this.handleCopy();
        }
        if (e.key === "v") {
          this.handlePaste();
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          this.emit(EVENT_DELETE, { item: this.selectedItem });
        }
      }

      if (e.key === "Tab") {
        e.preventDefault();
        this.addChildren();
      }
    });

    document.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    const update = debounce((data: ObjectBox[]) => {
      const d = data.map((item) => item.value);
      this.onValueUpdate && this.onValueUpdate(d);
    }, 200);

    this.on(EVENT_UPDATE, ({ name }) => {
      update(this.getAllIsolateObjectBox());
    });

    this.on(EVENT_LINK, ({ signBox, objectBox }) => {
      if (this.canvas === null) return;
      const line = new LinkLine(this.canvas, signBox, objectBox, this);
      this.addLinkLine(line);
    });

    this.on(
      EVENT_DELETE,
      ({ item }: { item: KeyValueBox | ObjectBox | LinkLine | null }) => {
        if (!item) return;
        item.delete();
        this.selectedItem = null;
      }
    );

    this.on(
      EVENT_SELECT,
      ({ item }: { item: LinkLine | KeyValueBox | ObjectBox }) => {
        console.log(EVENT_SELECT);
        if (item !== this.selectedItem) {
          console.log("111");
          this.selectedItem?.unselect();
        }
        item.select();
        this.selectedItem = item;
      }
    );

    this.canvas.click((event: Event) => {
      if (event.target === this.canvas?.node) {
        if (this.selectedItem) {
          this.selectedItem.unselect();
          this.selectedItem = null;
        }
      }
    });

    this.canvas.on("zoom", (event: any) => {
      if (this.onZoomCallback) {
        this.onZoomCallback(event.detail.level);
      }
    });
  };

  setUpdateCallback = (callback: (value: any) => void) => {
    this.onValueUpdate = callback;
  };

  setZoomCallback = (callback: (zoom: number) => void) => {
    this.onZoomCallback = callback;
  };

  private addChildren() {
    if (!(this.selectedItem instanceof ObjectBox) || !this.canvas) return;
    let key = "key";
    let value = "value";
    if (this.selectedItem.isArray) {
      key = this.selectedItem.value.length;
    }
    const keyvaluebox = new KeyValueBox(
      this.canvas,
      {
        x: 0,
        y: 0,
        key,
        value,
      },
      this,
      this.selectedItem
    );
    this.selectedItem.addChildren(keyvaluebox);
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
      layoutTree(newNode);
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  }

  initData = (data: Object | Object[]) => {
    if (!Array.isArray(data)) {
      data = [data];
    }
    (data as object[]).forEach((item) => {
      if (this.canvas === null) return;
      new ObjectBox(
        this.canvas,
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

  getAllIsolateObjectBox = () => {
    return this.objectBoxes.filter((box) => !box.parent);
  };

  addLinkLine = (linkline: LinkLine) => {
    this.linkLines.add(linkline);
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
      const keyValue = box.keyValue;
      const valueValue = box.valueValue;
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

  private handleCopy() {
    if (this.selectedItem instanceof ObjectBox) {
      const jsonStr = JSON.stringify(this.selectedItem.value);
      navigator.clipboard.writeText(jsonStr).catch((err) => {
        console.error("Failed to copy:", err);
      });
    }
  }
}

export const graph1 = new Graph();

export default Graph;
