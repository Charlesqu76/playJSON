import { Svg } from "@svgdotjs/svg.js";
import Canvas from "./canvas";

import ObjectBox, { TObjectBox } from "./component/ObjectBox";
import EventEmitter from "./utils/EventEmitter";
import keydown from "./event/keydown";
import { graphEvent } from "./event/index";
import { TKeyvalueBox } from "./component/keyValueBox";
import { TLine } from "./basic/Line";
import Input, { TInput } from "./basic/Input";
import TextEditor, { PADDING_X, PADDING_Y } from "./basic/TextEditor";
import { layoutTree } from "./utils/layout";

interface IProps {
  zoomCallback?: (zoom: number) => void;
}

class Graph extends EventEmitter {
  container: HTMLElement | null = null;
  canvas: Svg | null = null;
  zoomCallback: ((zoom: number) => void) | null = null;

  objectBoxes = new Set<TObjectBox>([]);
  keyValueBoxes = new Set<TKeyvalueBox>([]);
  linkLines: WeakSet<TLine> = new WeakSet([]);
  selectedItem: TLine | TKeyvalueBox | TObjectBox | null = null;
  mouseX: number = 0;
  mouseY: number = 0;
  isLinking: boolean = false;
  isKeyvvalueBoxMoving: boolean = false;
  isObjectBoxMoving: boolean = false;
  inputText: TInput;
  editting?: TextEditor;

  constructor(props: IProps) {
    super();
    const { zoomCallback } = props || {};
    this.zoomCallback = zoomCallback || null;
    this.inputText = new Input();
  }

  updateInputPosition = () => {
    if (!this.canvas || !this.editting) return;
    const scale = this.zoom;
    const { x, y } = this.editting.group.rbox();
    const { x: rx, y: ry } = this.canvas.rbox();
    this.inputText.div.style.transform = `translate(${x - rx + PADDING_X}px, ${
      y - ry + PADDING_Y
    }px) scale(${scale})`;
  };

  initCanvas = (id: string | HTMLElement) => {
    const conss = new Canvas(id, this);
    this.canvas = conss.canvas;
    this.container = conss.container;
    if (!this.container) throw new Error("Container not found");
    this.inputText.render(this.container);
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

    graphEvent(this);
  };

  recover(object: any) {
    if (!Array.isArray(object)) {
      object = [object];
    }

    object.forEach((item: any) => {
      const { x, y, value } = item;
      const box = new ObjectBox(
        {
          x,
          y,
          value,
        },
        this
      );
      layoutTree(box, x, y);
      box.layout();
    });
  }

  getInfo() {
    const result: any[] = [];
    this.noParentObjectBoxes.forEach((box) => {
      const { value, boundary } = box;
      const { x, y } = boundary;
      const boxInfo = {
        x,
        y,
        value,
      };
      result.push(boxInfo);
    });
    return result;
  }

  initData = (data: Object | Object[]) => {
    if (this.canvas === null) return;
    if (!Array.isArray(data)) {
      data = [data];
    }

    (data as object[]).forEach((item) => {
      new ObjectBox(
        {
          x: 0,
          y: 0,
          value: item,
        },
        this
      );
    });

    this.layout();
  };

  layout = () => {
    this.noParentObjectBoxes.forEach((box) => {
      layoutTree(box, box.x, box.y);
      box.layout(box.x, box.y);
      box.render();
    });
  };

  createObjectBox({
    x = 0,
    y = 0,
    value = {},
  }: {
    x?: number;
    y?: number;
    value?: any;
  }) {
    const box = new ObjectBox(
      {
        x,
        y,
        value,
      },
      this
    );
    layoutTree(box, x, y);
    box.render();
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

  get noParentObjectBoxes() {
    return Array.from(this.objectBoxes).filter((box) => box.parent === null);
  }

  get value() {
    const values = this.noParentObjectBoxes.map((item) => item.value);
    return values;
  }

  get zoom() {
    if (!this.canvas) return 1;
    return this.canvas.zoom();
  }
}

export default Graph;
