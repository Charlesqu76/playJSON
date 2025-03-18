import ObjectBox from "../ObjectBox";
import Graph from "../graph";
import {
  EVENT_LINK,
  EVENT_MOUSEOUT,
  EVENT_MOUSEOVER,
  EVENT_MOVE,
  EVENT_SELECT,
} from "@/garph/event";
import DraggableRect from "../basic/DraggableRect";
import isOverlapping from "@/garph/utils/isOverlapping";
import LinkLine from "../LinkLine";
import KeyEditor from "./KeyEditor";
import ValueEdit from "./ValueEditor";

const PADDING_Y = 5;
const PADDING_X = 10;

const BG_COLOR = "#fff";

interface Props {
  x: number;
  y: number;
  key: string;
  value: string | Object;
}

/**
 *
 * exact one parent - ObjectBox
 * exact one child -  ObjectBox
 *
 */

export default class KeyValueBox extends DraggableRect<ObjectBox> {
  defaultStyles = {
    fill: BG_COLOR,
    stroke: "black",
    "stroke-width": 1,
    rx: 5,
    ry: 5,
  };
  keyBox: KeyEditor;
  valueBox: ValueEdit;

  origin: { x: number; y: number } | null = null;
  realWidth = 0;

  child: ObjectBox | null = null;
  showChild: boolean = true;

  line: LinkLine | null = null;

  constructor({ x, y, key, value }: Props, graph: Graph, parent: ObjectBox) {
    super({ x, y, width: 0, height: 0 }, graph);
    this.rect.attr(this.defaultStyles);
    this.graph.addKeyValueBox(this);
    this.setParent(parent);

    this.keyBox = new KeyEditor(key, x, y, graph, this);
    if (this.parent?.isArray) {
      this.keyBox.hide();
    }

    this.valueBox = new ValueEdit(value, 0, 0, graph, this);

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

    this.initEvnet();
    this.setHeight();
    this.setWidth();
  }

  get key() {
    return this.keyBox.value;
  }

  get value() {
    return this.valueBox.value;
  }

  get entry() {
    return {
      [this.key]: this.value,
    };
  }

  setValue(value?: string) {
    if (this.child) {
      if (this.child.isArray) {
        this.valueBox.updateText("[]");
        this.valueBox.valueType = "array";
      } else {
        this.valueBox.updateText("{}");
        this.valueBox.valueType = "object";
      }
    } else {
      if (value) {
        this.valueBox.updateText(value);
      }
    }

    this.changed();
  }

  changed() {
    this.setWidth();
    this.setHeight();
    this.parent?.arrangeChildren();
  }

  initEvnet() {
    this.rect.on("mouseover", () => {
      this.graph.emit(EVENT_MOUSEOVER, { item: this });
    });

    this.rect.on("mouseout", () => {
      this.graph.emit(EVENT_MOUSEOUT, { item: this });
    });

    this.rect.on("click", () => {
      this.graph.emit(EVENT_SELECT, { item: this });
    });

    this.rect.on("dragstart", () => {
      this.origin = this.boundary;
    });

    this.rect.on(
      "dragmove",
      (event) => {
        const { box } = (event as CustomEvent).detail;

        this.move(box.x, box.y);
        if (this instanceof ObjectBox) return;
        for (const objectBox of this.graph.objectBoxes) {
          const overlap = isOverlapping(this, objectBox);
          if (overlap) {
            objectBox.rect.attr({ "stroke-width": 3, stroke: "red" });
          } else {
            objectBox.rect.attr({ "stroke-width": 1, stroke: "none" });
          }
        }
      },
      { passive: true }
    );

    this.rect.on("dragend", (event) => {
      const overlapItem = this.graph.objectBoxes.find((objectBox) =>
        isOverlapping(this, objectBox)
      );

      if (!overlapItem && this.origin) {
        this.move(this.origin.x, this.origin.y);
        return;
      }

      if (!overlapItem) {
        return;
      }

      if (this.parent === overlapItem && this.origin) {
        this.move(this.origin.x, this.origin.y);
        return;
      }

      if (this.parent !== overlapItem) {
        this.parent?.removeChildren(this);
        overlapItem.addChildren(this);
        overlapItem.rect.attr({ "stroke-width": 1, stroke: "none" });
      }
    });
  }

  calculatePosition(x: number, y: number) {
    const keyPostion = {
      x: x + PADDING_X,
      y: y + PADDING_Y,
    };
    const valuePosition = {
      x:
        x + (this.parent?.isArray ? 0 : this.keyBox.boundary.width) + PADDING_X,
      y: y + PADDING_Y,
    };
    return {
      keyPostion,
      valuePosition,
    };
  }

  move(x: number, y: number) {
    super.move(x, y);
    const { keyPostion, valuePosition } = this.calculatePosition(x, y);
    this.keyBox.move(keyPostion.x, keyPostion.y);
    this.valueBox.move(valuePosition.x, valuePosition.y);
    this.emit(EVENT_MOVE);
  }

  calculateWidth() {
    const width = this.parent?.isArray
      ? this.valueBox.boundary.width
      : this.keyBox.boundary.width + this.valueBox.boundary.width;
    return width + PADDING_X * 2;
  }

  setWidth() {
    const width = this.calculateWidth();
    super.setWidth(width);
    this.realWidth = width;
  }

  calculateHeight() {
    return this.valueBox.boundary.height + PADDING_Y * 2;
  }

  setHeight() {
    const height = this.calculateHeight();
    super.setHeight(height);
  }

  setLine(line: LinkLine | null) {
    this.line = line;
  }

  setChild(payload: ObjectBox | null) {
    this.child = payload;
  }

  front() {
    super.front();
    this.keyBox.front();
    this.valueBox.front();
  }

  show() {
    super.show();
    this.keyBox.show();
    this.valueBox.show();
  }

  hide() {
    super.hide();
    this.keyBox.hide();
    this.valueBox.hide();
  }

  delete() {
    this.parent?.removeChildren(this);
    if (this.line) {
      this.line.delete();
    }
    super.remove();
    this.keyBox.delete();
    this.valueBox.delete();
  }
}
