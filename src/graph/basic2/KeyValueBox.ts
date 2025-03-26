import ObjectBox, { TObjectBox } from "./ObjectBox";
import Graph from "..";
import KeyEditor, { TKeyEditor } from "./KeyEditor";
import ValueEdit, { TValueEditor } from "./ValueEditor";
import { highlightRect, unHighlightRect } from "../utils/rect";
import Box from ".";
import {
  EVENT_CREATE,
  EVENT_MOUSEOUT,
  EVENT_MOUSEOVER,
  EVENT_SELECT,
  EVENT_UPDATE,
} from "../event";
import {
  calculatePosition,
  calculateWidthAndHeight,
} from "../utils/keyValueBox";
import GroupRect, { TGroupRect } from "./GroupRect";
import { EVENT_EDITING } from "./TextEditor";
import Sign, { TSign } from "./Sign";
import { signLink } from "../event/keyvaluebox/sign";
import { EVENT_LINE_UPDATE } from "../basic/Line";
import { dragEnd, dragMove, dragStart } from "../event/keyvaluebox/drag";

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
  origin: { x: number; y: number } | null = null;
  constructor({ key, value }: Props, graph: Graph) {
    const keyBox = new KeyEditor(key, 0, 0, graph);
    const valueBox = new ValueEdit(value, 0, 0, graph);
    const { width, height } = calculateWidthAndHeight(keyBox, valueBox);
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

  setWidthUnderParent(width: number) {
    if (!this.container) return;
    this.container.setWidth(width);
    this.sign?.move(
      this.x + this.container.width - 4,
      this.y + this.container.height / 2 - 4
    );
  }

  setWidth(width: number): void {
    this.width = width;
    this.groupRect?.setWidth(this.width);
  }

  setHeight(height: number): void {
    this.height = height;
    this.groupRect?.setHeight(this.height);
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

    const { keyPostion, valuePosition } = calculatePosition({
      x: this.x,
      y: this.y,
      keyBox: this.keyBox,
    });
    this.keyBox.render(keyPostion.x, keyPostion.y);
    this.valueBox.render(valuePosition.x, valuePosition.y);
    this.groupRect.add(this.keyBox.group);
    this.groupRect.add(this.valueBox.group);

    this.sign = new Sign(
      {
        x: this.x + this.groupRect.container.width - 4,
        y: this.y + this.groupRect.container.height / 2 - 4,
      },
      this.graph
    );

    this.group?.add(this.sign.sign);

    this.valueBox?.textBox?.text?.on(EVENT_EDITING, () => {
      const { width, height } = calculateWidthAndHeight(
        this.keyBox,
        this.valueBox
      );
      this.width = width;
      this.height = height;
      this.parent?.arrangeChildren();

      this.graph.emit(EVENT_UPDATE, {
        name: "updateText",
      });
    });

    dragStart(this);

    dragMove(this);

    dragEnd(this);

    this.group?.on("mouseenter", () => {
      this.graph.emit(EVENT_MOUSEOVER, { item: this });
    });

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

    signLink(this);

    this.renderChild();
  }

  renderChild() {
    if (this.child) {
      this.child.render();
    }
  }

  move(x: number, y: number) {
    this.group?.move(x, y);
    this.x = x;
    this.y = y;
    this.emit(EVENT_LINE_UPDATE);
  }

  front() {
    this.group?.front();
    this.container?.front();
    this.keyBox?.front();
    this.valueBox?.front();
    this.sign?.front();
  }

  highlight() {
    if (!this.container) return;
    highlightRect(this.container.rect);
  }

  unHighlight() {
    if (!this.container) return;
    unHighlightRect(this.container?.rect);
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
    this.parent?.arrangeChildren();
  }

  setParent(parent: TObjectBox | null) {
    this.parent = parent;
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
}
