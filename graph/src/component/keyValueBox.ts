import ObjectBox, { TObjectBox } from "./ObjectBox";
import Graph from "../index";
import Box from "../basic/Box";
import { EVENT_CREATE, EVENT_SELECT } from "../event";
import GroupRect, { TGroupRect } from "../basic/GroupRect";
import { EVENT_EDITING } from "../basic/TextEditor";
import Sign, { TSign } from "../basic/Sign";
import { link } from "../event/keyvaluebox/sign";
import { EVENT_LINE_UPDATE } from "../basic/Line";
import { dragEnd, dragMove } from "../event/keyvaluebox/drag";
import {
  calculatePosition,
  calculateWidthAndHeight,
  getText,
  isObject,
} from "../utils/keyValueBox";
import TextBox from "./TextBox";
import { layoutTree } from "@/utils/layout";

const BG_COLOR = "#fff";
const VALUE_COLOR = "green";

interface Props {
  x?: number;
  y?: number;
  key: string;
  value: string | Object;
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
  constructor({ key, value, parent }: Props, graph: Graph) {
    super({ graph });
    this.keyBox = new TextBox({ text: key }, graph);
    this.valueBox = new TextBox(
      {
        text: getText(value) as string,
        style: {
          color: VALUE_COLOR,
        },
      },
      graph
    );
    const { width, height } = this.boundary;
    this.setWidth(width);
    this.setHeight(height);
    this._parent = parent;

    if (isObject(value)) {
      this._child = new ObjectBox(
        {
          value,
          parent: this,
        },
        graph
      );
    }

    this.graph.emit(EVENT_CREATE, { item: this });
  }

  render(x: number = this.x, y: number = this.y) {
    this.x = x;
    this.y = y;
    if (!this.groupRect) {
      this._init();
    } else {
      this._move();
    }
    this.emit(EVENT_LINE_UPDATE);
  }

  private _init() {
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
        x: this.groupRect.boundary.cx,
        y: this.groupRect.boundary.cy,
      },
      this.graph
    );
    this.groupRect?.add(this.sign.sign);

    this.renderChild();

    this.initEvent();
  }

  private _move() {
    this.groupRect?.move(this.x, this.y);
    const { keyPostion, valuePosition } = calculatePosition({
      x: this.x,
      y: this.y,
      keyBox: this.keyBox,
    });
    this.keyBox.render(keyPostion.x, keyPostion.y);
    this.valueBox.render(valuePosition.x, valuePosition.y);
    this.sign?.move(
      this.x + this.width - this.sign.boundary.width / 2,
      this.y + this.height / 2 - this.sign.boundary.height / 2
    );
  }

  initEvent() {
    this.group?.on("dragmove", (event) => {
      this.graph.recordAction("dragmove", this);
      dragMove(event as CustomEvent, this);
    });

    this.group?.on("dragend", (event) => {
      this.graph.recordAction("dragend", this);
      dragEnd(event as CustomEvent, this);
    });

    this.group?.on("click", (e) => {
      this.graph.recordAction("click", this);
      e.stopPropagation();
      this.graph.emit(EVENT_SELECT, { item: this });
    });

    this.sign?.sign.on("mousedown", (event) => {
      this.graph.recordAction("mousedown", this);
      link(event as MouseEvent, this);
    });

    this.sign?.sign.on("click", (e) => {
      this.graph.recordAction("click", this);
      if (!this.child) return;
      // this.graph.emit(EVENT_SELECT, { item: this });
      e.stopPropagation();
      this.showChild = !this.showChild;
      layoutTree(this.parent);
      this.parent.layout();
      if (!this.showChild) {
        this.child?.container?.hide();
      } else {
        this.child?.container?.show();
      }
    });
  }

  setWidth(width: number): void {
    this.width = width;
    this.groupRect?.setWidth(width);
    this.sign?.move(
      this.x + this.width - this.sign.boundary.width / 2,
      this.y + this.height / 2 - this.sign.boundary.height / 2
    );
  }

  setHeight(height: number): void {
    this.height = height;
    this.groupRect?.setHeight(height);
  }

  renderKeyAndValue() {
    const { width, height } = this.boundary;
    this.width = width;
    this.height = height;
    this.parent?.renderChildren();
  }

  renderChild() {
    this.child?.render();
  }

  front() {
    this.groupRect?.front();
    this.keyBox?.front();
    this.valueBox?.front();
    this.sign?.front();
  }

  show() {
    this.groupRect?.show();
    this.keyBox?.show();
    this.valueBox?.show();
    this.sign?.show();
    this.child?.show();
  }

  hide() {
    this.groupRect?.hide();
    this.keyBox?.hide();
    this.valueBox?.hide();
    this.sign?.hide();
    this.child?.hide();
  }

  layout() {
    this.render();
    if (this.child) {
      this.child.layout();
    }
  }

  delete() {
    if (this.child) {
      this.child.unlink();
    }
    this.parent?.removeChildren(this);
    this.groupRect?.delete();
    this.graph.keyValueBoxes.delete(this);
  }

  highlight() {
    this.groupRect?.highlight();
  }

  unHighlight() {
    this.groupRect?.unHighlight();
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

  get child() {
    return this._child;
  }

  set child(child: TObjectBox | null) {
    this._child = child;
    if (!child) {
      this.valueBox.updateText("null");
      this.valueBox.textBox?.setDisabled(false);
      return;
    }
    this.valueBox.textBox?.setDisabled(true);

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
      this.parent?.renderChildren();
    }
  }

  get keyChain(): Array<string> {
    if (!this.parent) return [];
    const key = this.parent.isArray ? `[${this.key}]` : this.key;
    return [...this.parent.keyChain, key];
  }

  get boundary() {
    const { width, height } = calculateWidthAndHeight(
      this.keyBox,
      this.valueBox
    );
    return {
      x: this.x,
      y: this.y,
      width,
      height,
    };
  }
}
