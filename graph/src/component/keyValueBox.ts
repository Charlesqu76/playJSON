import ObjectBox, { TObjectBox } from "./ObjectBox";
import Graph from "../index";
import Box from "../basic/Box";
import {
  EVENT_CREATE,
  EVENT_MOUSEOUT,
  EVENT_MOUSEOVER,
  EVENT_SELECT,
} from "../event";
import GroupRect, { TGroupRect } from "../basic/GroupRect";
import { EVENT_EDITING } from "../basic/TextEditor";
import Sign, { TSign } from "./Sign";
import { signLink } from "../event/keyvaluebox/sign";
import { EVENT_LINE_UPDATE } from "../basic/Line";
import { dragEnd, dragMove } from "../event/keyvaluebox/drag";
import {
  calculatePosition,
  calculateWidthAndHeight,
  getText,
  isObject,
} from "../utils/keyValueBox";
import TextBox from "./TextBox";

const BG_COLOR = "#fff";
const VALUE_COLOR = "green";

interface Props {
  x?: number;
  y?: number;
  key: string;
  value: string | Object;
  isArray: boolean;
  parent: TObjectBox;
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
  keyBox: TextBox;
  valueBox: TextBox;
  private _parent: TObjectBox;
  private _child: TObjectBox | null = null;
  showChild: boolean = true;
  origin: { x: number; y: number } | null = null;
  constructor({ key, value, parent }: Props, graph: Graph) {
    const keyBox = new TextBox({ text: key, x: 0, y: 0 }, graph);
    const valueBox = new TextBox(
      {
        text: getText(value) as string,
        y: 0,
        x: 0,
        style: {
          color: VALUE_COLOR,
        },
      },
      graph
    );
    const { width, height } = calculateWidthAndHeight(keyBox, valueBox);
    super({ width, height, graph });
    this._parent = parent;
    this.keyBox = keyBox;
    this.valueBox = valueBox;
    if (isObject(value)) {
      this._child = new ObjectBox(
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
    this.setWidth(width);
    this.sign?.move(this.x + this.width - 4, this.y + this.height / 2 - 4);
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
    this.groupRect.add(this.keyBox.group);
    this.keyBox.textBox?.group?.on(EVENT_EDITING, () =>
      this.renderKeyAndValue()
    );

    this.valueBox.render(valuePosition.x, valuePosition.y);
    this.groupRect.add(this.valueBox.group);
    this.valueBox.group?.on(EVENT_EDITING, () => this.renderKeyAndValue());

    this.sign = new Sign(
      {
        x: this.x + this.groupRect.width - 4,
        y: this.y + this.groupRect.height / 2 - 4,
      },
      this.graph
    );

    this.group?.add(this.sign.sign);

    dragMove(this);

    dragEnd(this);

    this.group?.on("mouseenter", () => {
      this.graph.emit(EVENT_MOUSEOVER, { item: this });
    });

    this.group?.on("mouseleave", () => {
      this.graph.emit(EVENT_MOUSEOUT, { item: this });
    });

    this.group?.on("click", (e) => {
      e.stopPropagation();
      this.graph.emit(EVENT_SELECT, { item: this });
    });

    signLink(this);
    this.renderChild();
  }

  renderKeyAndValue() {
    const { width, height } = calculateWidthAndHeight(
      this.keyBox,
      this.valueBox
    );
    this.width = width;
    this.height = height;
    this.parent?.arrangeChildren();
  }

  renderChild() {
    if (!this.child) return;
    this.child.render();
  }

  move(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.groupRect?.move(x, y);
    const { keyPostion, valuePosition } = calculatePosition({
      x: this.x,
      y: this.y,
      keyBox: this.keyBox,
    });
    this.keyBox.render(keyPostion.x, keyPostion.y);
    this.valueBox.render(valuePosition.x, valuePosition.y);
    this.emit(EVENT_LINE_UPDATE);
  }

  front() {
    this.groupRect?.front();
    this.keyBox?.front();
    this.valueBox?.front();
    this.sign?.front();
  }

  highlight() {
    this.groupRect?.highlight();
  }

  unHighlight() {
    this.groupRect?.unHighlight();
  }

  delete() {
    if (this.child) {
      this.child.unlink();
    }
    this.parent?.removeChildren(this);
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
    return String(this.keyBox.text);
  }

  get value() {
    if (this.child) {
      return this.child.value;
    }
    return this.valueBox.text;
  }

  get entry() {
    return {
      [this.key]: this.value,
    };
  }

  get child() {
    return this._child;
  }

  set child(child: TObjectBox | null) {
    this._child = child;
    if (!child) {
      this.valueBox.updateText("null");
      return;
    }
    if (child.isArray) {
      this.valueBox.updateText("[]");
    } else {
      this.valueBox.updateText("{}");
    }
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: TObjectBox) {
    this._parent = parent;
    if (!parent) {
      return;
    }
    if (parent.isArray) {
      this.keyBox.updateText(parent.children.size - 1);
      this.parent?.arrangeChildren();
    }
  }

  get keyChain(): Array<string> {
    if (!this.parent) return [];
    const key = this.parent.isArray ? `[${this.key}]` : this.key;
    return [...this.parent.keyChain, key];
  }
}
