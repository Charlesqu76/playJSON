// src/main.ts
import { SVG } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";
import "@svgdotjs/svg.panzoom.js";
import ObjectBox from "./ObjectBox";
import { Svg } from "@svgdotjs/svg.js";
import KeyValueBox from "./keyvalueBox";
import LinkLine from "./LinkLine";
import { layoutTree } from "./utils/layout";
import EventEmitter from "./utils/EventEmitter";
import {
  EVENT_DELETE,
  EVENT_LINK,
  EVENT_UNLINK,
  EVENT_UPDATE,
  EVENT_SELECT,
  EVENT_MOUSEOUT,
  EVENT_MOUSEOVER,
} from "@/garph/event";
import debounce from "./utils/debounce";
import mouseout from "./event/mouseout";
import mouseover from "./event/mouseover";
import link from "./event/link";
import unlink from "./event/unlink";
import deleteItem from "./event/delete";
import select from "./event/select";
import keydown from "./event/keydown";

class Graph extends EventEmitter {
  canvas: Svg | null = null;
  private onZoomCallback: ((zoom: number) => void) | null = null;
  private onValueUpdate: ((value: any) => void) | null = null;
  objectBoxes: ObjectBox[] = [];
  keyValueBoxes: KeyValueBox[] = [];
  linkLines: WeakSet<LinkLine> = new WeakSet([]);
  selectedItem: LinkLine | KeyValueBox | ObjectBox | null = null;
  mouseX: number = 0;
  mouseY: number = 0;
  isLinking: boolean = false;

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
      keydown(e, this);
    });

    document.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    const update = debounce((data: ObjectBox[]) => {
      const d = data.map((item) => item.value);
      this.onValueUpdate && this.onValueUpdate(d);
    }, 200);

    this.on(EVENT_UPDATE, (data) => {
      console.log(data);
      update(this.getAllIsolateObjectBox());
    });

    this.on(EVENT_LINK, ({ keyvalueBox, objectBox }) => {
      link(this, { keyvalueBox, objectBox });
    });

    this.on(EVENT_UNLINK, ({ keyvalueBox }) => {
      unlink(this, keyvalueBox);
    });

    this.on(EVENT_DELETE, ({ item }) => {
      deleteItem(this, item);
    });

    this.on(EVENT_SELECT, ({ item }) => {
      select(this, item);
    });

    this.on(EVENT_MOUSEOUT, ({ item }) => {
      mouseout(this, item);
    });

    this.on(EVENT_MOUSEOVER, ({ item }) => {
      mouseover(this, item);
    });

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

    this.canvas.on("panned", (event: any) => {
      console.log("panned", event);
    });
  };

  setUpdateCallback = (callback: (value: any) => void) => {
    this.onValueUpdate = callback;
  };

  setZoomCallback = (callback: (zoom: number) => void) => {
    this.onZoomCallback = callback;
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
  };

  addObjectBox = (box: ObjectBox) => {
    this.objectBoxes.push(box);
  };

  addKeyValueBox = (box: KeyValueBox) => {
    this.keyValueBoxes.push(box);
  };

  addLinkLine = (linkline: LinkLine) => {
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

  get values() {
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
