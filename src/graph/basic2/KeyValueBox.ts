import ObjectBox, { TObjectBox } from "./ObjectBox";
import Graph from "..";
import isOverlapping from "@/graph/utils/isOverlapping";
import LinkLine from "../LinkLine";
import KeyEditor from "./KeyEditor";
import ValueEdit from "./ValueEditor";
import { highlightRect, unHighlightRect } from "../utils/rect";
import Box from ".";
import NormalRect from "../basic/NormalReact";
import { G } from "@svgdotjs/svg.js";
import {
  EVENT_LINK,
  EVENT_MOUSEOUT,
  EVENT_MOUSEOVER,
  EVENT_SELECT,
} from "../event";

const PADDING_Y = 5;
const PADDING_X = 10;

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

function calculatePosition({
  x,
  y,
  keyBox,
  isArray,
}: {
  x: number;
  y: number;
  keyBox: KeyEditor;
  isArray: boolean;
}) {
  const keyPostion = {
    x: x + PADDING_X,
    y: y + PADDING_Y,
  };
  const valuePosition = {
    x: x + (isArray ? 0 : keyBox.width) + PADDING_X + 4 + 4,
    y: y + PADDING_Y,
  };
  return {
    keyPostion,
    valuePosition,
  };
}

function calculateHeight(valueBox: ValueEdit) {
  return valueBox.height + PADDING_Y * 2 + 4;
}

function calculateWidth(
  keyBox: KeyEditor,
  valueBox: ValueEdit,
  isArray: boolean
) {
  const width = isArray ? valueBox.width : keyBox.width + valueBox.width;
  return width + PADDING_X * 2 + 8 + 4;
}

export type TKeyvalueBox = KeyValueBox;

export default class KeyValueBox extends Box {
  container?: NormalRect<any>;
  defaultStyles = {
    fill: BG_COLOR,
    stroke: "black",
    "stroke-width": 1,
    rx: 5,
    ry: 5,
  };
  keyBox: KeyEditor;
  valueBox: ValueEdit;
  group?: G;

  public origin: { x: number; y: number } | null = null;
  realWidth = 0;

  child: TObjectBox | null = null;
  showChild: boolean = true;

  line: LinkLine | null = null;

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
        },
        graph
      );
      this.graph.emit(EVENT_LINK, { keyvalueBox: this, objectBox: this.child });
    }
  }

  render(x: number, y: number) {
    if (!this.graph?.canvas) return;
    this.x = x ?? this.x;
    this.y = y ?? this.y;
    this.group = this.graph.canvas.group();
    this.group?.draggable();

    this.container = new NormalRect(
      { x, y, width: this.width, height: this.height },
      this.graph
    );
    this.container.rect.attr(this.defaultStyles);
    const { keyPostion, valuePosition } = calculatePosition({
      x: this.x,
      y: this.y,
      keyBox: this.keyBox,
      isArray: false,
    });
    this.keyBox.render(keyPostion.x, keyPostion.y);
    this.valueBox.render(valuePosition.x, valuePosition.y);

    this.group?.add(this.container.rect);
    this.keyBox.keyEditor && this.group?.add(this.keyBox.keyEditor?.group);
    this.valueBox.ValueEditor &&
      this.group?.add(this.valueBox.ValueEditor?.group);

    this.group.on("dragstart", () => {
      this.origin = this.boundary;
      this.graph.isKeyvvalueBoxMoving = true;
    });

    this.group.on(
      "dragmove",
      (event) => {
        const { box } = (event as CustomEvent).detail;
        const overlapItem = this.graph.objectBoxes.find((objectBox) => {
          return (
            isOverlapping(box, objectBox.boundary) && objectBox !== this.parent
          );
        });
        this.graph.objectBoxes.forEach((objectBox) => {
          if (overlapItem === objectBox) {
            highlightRect(objectBox.container?.rect);
          } else {
            unHighlightRect(objectBox.container?.rect);
          }
        });
      },
      { passive: true }
    );

    this.group.on(
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

        overlapItem.group?.add(this.group);
        // unHighlightRect(overlapItem.rect);
        this.parent?.removeChildren(this);
        overlapItem.addChildren(this);
      },
      { passive: true }
    );

    this.group.on("mouseover", () => {
      this.graph.emit(EVENT_MOUSEOVER, { item: this });
    });
    this.group.on("mouseout", () => {
      this.graph.emit(EVENT_MOUSEOUT, { item: this });
    });

    this.group.on(
      "click",
      () => {
        this.graph.emit(EVENT_SELECT, { item: this });
      },
      { passive: true }
    );
  }
  move(x: number, y: number) {
    this.group?.move(x, y);
    this.x = x;
    this.y = y;
  }
  front() {
    this.group?.front();
    this.container?.front();
    this.keyBox?.front();
    this.valueBox?.front();
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

  link(line: LinkLine, objectBox: ObjectBox) {
    this.line = line;
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
    this.line = null;
    this.child = null;
    this.valueBox.updateText("null");
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
}
