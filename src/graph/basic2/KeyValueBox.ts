import ObjectBox, { TObjectBox } from "./ObjectBox";
import Graph from "..";
import isOverlapping from "@/graph/utils/isOverlapping";
import KeyEditor, { TKeyEditor } from "./KeyEditor";
import ValueEdit, { TValueEditor } from "./ValueEditor";
import { highlightRect, unHighlightRect } from "../utils/rect";
import Box from ".";
import {
  EVENT_CREATE,
  EVENT_LINK,
  EVENT_MOUSEOUT,
  EVENT_MOUSEOVER,
  EVENT_MOVE,
  EVENT_SELECT,
  EVENT_UPDATE,
} from "../event";
import {
  calculateHeight,
  calculatePosition,
  calculateWidth,
} from "../utils/keyValueBox";
import GroupRect, { TGroupRect } from "./GroupRect";
import { EVENT_EDITING } from "./TextEditor";
import Sign, { TSign } from "./Sign";
import { Line } from "@svgdotjs/svg.js";
import { getRightMid, isPointInBox } from "../utils";

const BG_COLOR = "#fff";

interface Props {
  x?: number;
  y?: number;
  key: string;
  value: string | Object;
  isArray: boolean;
}

/**
 *
 * exact one parent - ObjectBox
 * exact one child -  ObjectBox
 *
 */

export type TKeyvalueBox = KeyValueBox;

export default class KeyValueBox extends Box {
  groupRect?: TGroupRect;
  sign?: TSign;
  keyBox: TKeyEditor;
  valueBox: TValueEditor;
  parent: TObjectBox | null = null;
  child: TObjectBox | null = null;
  showChild: boolean = true;
  private origin: { x: number; y: number } | null = null;
  constructor({ key, value, isArray }: Props, graph: Graph) {
    const keyBox = new KeyEditor(key, 0, 0, graph);
    const valueBox = new ValueEdit(value, 0, 0, graph);
    const height = calculateHeight(valueBox);
    const width = calculateWidth(keyBox, valueBox, isArray);
    super({ width, height, graph });
    this.keyBox = keyBox;
    this.valueBox = valueBox;
    if (this.valueBox.valueType !== "string") {
      this.child = new ObjectBox(
        {
          x: 0,
          y: 0,
          value,
          parent: this,
        },
        graph
      );
    }
    this.graph.emit(EVENT_CREATE, { item: this });
  }

  render(x: number, y: number) {
    this.x = x ?? this.x;
    this.y = y ?? this.y;
    if (!this.group) {
      this.init();
    } else {
      this.move(this.x, this.y);
    }
  }

  init() {
    if (!this.graph?.canvas) return;
    this.groupRect = new GroupRect(
      {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        style: {
          fill: BG_COLOR,
        },
      },
      this.graph
    );

    if (this.child) {
      this.child.render();
    }

    const { keyPostion, valuePosition } = calculatePosition({
      x: this.x,
      y: this.y,
      keyBox: this.keyBox,
      isArray: this.parent?.isArray,
    });
    if (!this.parent?.isArray) {
      this.keyBox.render(keyPostion.x, keyPostion.y);
    }

    this.sign = new Sign(
      {
        x: this.x + this.groupRect.container.width - 4,
        y: this.y + this.groupRect.container.height / 2 - 4,
      },
      this.graph
    );

    this.group?.add(this.sign.sign);

    this.valueBox.render(valuePosition.x, valuePosition.y);

    this.keyBox?.textBox?.group && this.group?.add(this.keyBox.textBox.group);
    this.valueBox.textBox?.group &&
      this.group?.add(this.valueBox.textBox?.group);

    this.valueBox?.textBox?.text?.on(EVENT_EDITING, () => {
      this.width = calculateWidth(this.keyBox, this.valueBox, false);
      this.height = calculateHeight(this.valueBox);
      this.parent?.arrangeChildren();

      this.graph.emit(EVENT_UPDATE, {
        name: "updateText",
      });
    });

    this.group?.on("dragstart", () => {
      this.origin = this.boundary;
      this.graph.isKeyvvalueBoxMoving = true;
    });

    this.group?.on(
      "dragmove",
      (event) => {
        this.emit(EVENT_MOVE);
        const { box } = (event as CustomEvent).detail;
        const overlapItem = this.graph.objectBoxes.find((objectBox) => {
          return (
            isOverlapping(box, objectBox.boundary) && objectBox !== this.parent
          );
        });
        this.graph.objectBoxes.forEach((objectBox) => {
          if (overlapItem === objectBox) {
            objectBox.highlight();
          } else {
            objectBox.unHighlight();
          }
        });
      },
      { passive: true }
    );

    this.group?.on(
      "dragend",
      (event) => {
        const { box } = (event as CustomEvent).detail;

        setTimeout(() => {
          this.graph.isKeyvvalueBoxMoving = false;
        }, 10);

        const overlapItem = this.graph.objectBoxes.find((objectBox) => {
          const is = isOverlapping(box, objectBox.boundary);
          return is && objectBox !== this.parent;
        });

        if (!overlapItem) {
          if (this.origin) {
            this.move(this.origin.x, this.origin.y);
          }
          return;
        }

        this.group && overlapItem.group?.add(this.group);
        this.parent?.removeChildren(this);
        overlapItem.addChildren(this);
      },
      { passive: true }
    );

    this.group?.on(
      "mouseenter",
      () => {
        this.graph.emit(EVENT_MOUSEOVER, { item: this });
      },
      { passive: true }
    );
    this.group?.on("mouseleave", () => {
      this.graph.emit(EVENT_MOUSEOUT, { item: this });
    });

    this.group?.on(
      "click",
      (event) => {
        this.graph.emit(EVENT_SELECT, { item: this });
        event.stopPropagation();
      },
      { passive: true }
    );
    this.sign?.sign.on(
      "mousedown",
      (event) => {
        if (!this.parent || !this.graph.canvas || !this.sign) return;
        event = event as MouseEvent;
        event.stopPropagation();
        this.graph.isLinking = true;
        let tempLine: Line | null = null;
        const svgPoint = (
          this.graph?.canvas?.node as SVGSVGElement
        ).createSVGPoint();
        const startPos = getRightMid(this.sign);
        tempLine = this.graph.canvas
          .line(startPos.x, startPos.y, startPos.x, startPos.y)
          .stroke({ width: 2, color: "#000" });
        const mousemove = (e: MouseEvent) => {
          e.preventDefault();
          svgPoint.x = e.clientX;
          svgPoint.y = e.clientY;
          const cursor = svgPoint.matrixTransform(
            (this.graph.canvas?.node as SVGSVGElement).getScreenCTM()?.inverse()
          );
          tempLine?.plot(startPos.x, startPos.y, cursor.x, cursor.y);
          for (const objectBox of this.graph.objectBoxes) {
            if (
              isPointInBox({ x: cursor.x, y: cursor.y }, objectBox) &&
              objectBox !== this.parent
            ) {
              objectBox.highlight();
            } else {
              objectBox.unHighlight();
            }
          }
          tempLine?.front();
        };
        const mouseup = (e: MouseEvent) => {
          this.graph.isLinking = false;
          const cursor = svgPoint.matrixTransform(
            (this.graph.canvas?.node as SVGSVGElement).getScreenCTM()?.inverse()
          );
          const objectBox = this.graph.objectBoxes.find((box) =>
            isPointInBox({ x: cursor.x, y: cursor.y }, box)
          );
          if (objectBox) {
            objectBox.unHighlight();
          }
          if (objectBox && this.child !== objectBox) {
            this.graph.emit(EVENT_LINK, {
              keyvalueBox: this,
              objectBox: objectBox,
            });
            objectBox.line?.render();
          }
          tempLine?.remove();
          tempLine = null;
          document.removeEventListener("mousemove", mousemove);
          document.removeEventListener("mouseup", mouseup);
        };
        document.addEventListener("mousemove", mousemove);
        document.addEventListener("mouseup", mouseup);
      },
      { passive: true }
    );
  }

  move(x: number, y: number) {
    this.group?.move(x, y);
    this.x = x;
    this.y = y;
    this.emit(EVENT_MOVE);
  }

  front() {
    this.group?.front();
    this.container?.front();
    this.keyBox?.front();
    this.valueBox?.front();
    this.sign?.front();
  }

  back() {
    this.group?.back();
    this.container?.back();
    this.keyBox?.back();
    this.valueBox?.back();
  }

  highlight() {
    if (this.container) {
      highlightRect(this.container?.rect);
    }
  }

  unHighlight() {
    if (this.container) {
      unHighlightRect(this.container?.rect);
    }
  }

  link(objectBox: TObjectBox) {
    this.child = objectBox;
    if (this.child.isArray) {
      this.valueBox.updateText("[]");
      this.valueBox.valueType = "array";
    } else {
      this.valueBox.updateText("{}");
      this.valueBox.valueType = "object";
    }
  }

  unlink() {
    this.child = null;
    this.valueBox.updateText("null");
  }

  setParent(parent: TObjectBox | null) {
    this.parent = parent;
  }

  get container() {
    return this.groupRect?.container;
  }

  get group() {
    return this.groupRect?.group;
  }

  get key() {
    return String(this.keyBox.value);
  }

  get value() {
    if (this.child) {
      return this.child.value;
    }
    return this.valueBox.value;
  }

  get entry() {
    return {
      [this.key]: this.value,
    };
  }

  delete() {
    if (this.child) {
      this.child.unlink();
    }
    this.parent?.removeChildren(this);
    this.parent = null;
    this.groupRect?.delete();
    this.groupRect = undefined;
  }
}
