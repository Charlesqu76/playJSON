import { SVG } from "@svgdotjs/svg.js";
import { Svg } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";
import "@svgdotjs/svg.panzoom.js";

import ObjectBox, { TObjectBox } from "./component/ObjectBox";
import EventEmitter from "./utils/EventEmitter";
import keydown from "./event/keydown";
import { graphEvent } from "./event/index";
import { TKeyvalueBox } from "./component/keyValueBox";
import { TLine } from "./basic/Line";
import Input, { TInput } from "./basic/Input";

const MAX_ZOOM = 2;
const MIN_ZOOM = 0.1;

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

  noParentObjectBoxes = new Set<TObjectBox>([]);
  objectBoxes = new Set<TObjectBox>([]);
  keyValueBoxes: TKeyvalueBox[] = [];
  linkLines: WeakSet<TLine> = new WeakSet([]);
  selectedItem: TLine | TKeyvalueBox | TObjectBox | null = null;
  mouseX: number = 0;
  mouseY: number = 0;
  isLinking: boolean = false;
  isKeyvvalueBoxMoving: boolean = false;
  isObjectBoxMoving: boolean = false;
  inputText: TInput;

  constructor(props: IProps) {
    super();
    const { zoomCallback, valueChanged, json } = props || {};
    this.zoomCallback = zoomCallback || null;
    this.valueChanged = valueChanged || null;
    this.inputText = new Input();
  }

  updateInputPosition = () => {
    const scale = this.zoom;
    if (!this.canvas) return;
    const { x, y } = this.viewpoint;

    this.inputText.div.style.transform = `translate(${-x * scale}px, ${
      -y * scale
    }px) scale(${scale})`;
  };

  initCanvas = (id: string | HTMLElement) => {
    this.container = id as HTMLElement;
    if (typeof id === "string") {
      this.container = document.querySelector(id);
    }
    if (!this.container) return;
    this.container.style.position = "relative";
    this.inputText.render(this.container);

    const { width, height } = this.container.getBoundingClientRect();
    this.canvas = SVG()
      .addTo(id)
      .size("100%", "100%")
      .viewbox(`0 0 ${width} ${height}`)
      .panZoom({ zoomMin: MIN_ZOOM, zoomMax: MAX_ZOOM, zoomFactor: 0.1 });

    this.initEvent();
  };

  initEvent = () => {
    if (!this.canvas) return;

    this.canvas.on("zoom", (e) => {
      this.updateInputPosition();
    });

    this.canvas.on("panning", (e) => {
      this.updateInputPosition();
    });

    document.addEventListener("keydown", (e) => {
      keydown(e, this);
    });

    document.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    graphEvent(this);
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
    this.getAllIsolateObjectBox.forEach((box) => {
      box.layout();
      box.render();
    });
  };

  addKeyValueBox = (box: TKeyvalueBox) => {
    this.keyValueBoxes.push(box);
  };

  addObjectBox = (box: TObjectBox) => {
    this.objectBoxes.add(box);
  };

  addLinkLine = (linkline: TLine) => {
    this.linkLines.add(linkline);
  };

  get getAllIsolateObjectBox() {
    return Array.from(this.objectBoxes).filter((box) => box.parent === null);
  }

  centerViewOn({
    x,
    y,
    item,
  }: {
    x?: number;
    y?: number;
    item?: TKeyvalueBox;
  }) {
    if (!this.canvas) return;

    const viewbox = this.canvas.viewbox();
    let newX = x || 0;
    let newY = y || 0;
    if (item) {
      const { x, y } = item.boundary;
      newX = x;
      newY = y;
    }
    newX -= viewbox.width / 2;
    newY -= viewbox.height / 2;
    this.canvas
      .animate(200)
      .viewbox(newX, newY, viewbox.width, viewbox.height)
      .zoom(0.8);
  }

  get value() {
    const values = this.getAllIsolateObjectBox.map((item) => item.value);
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
