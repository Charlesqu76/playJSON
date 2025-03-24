import Graph from "..";
import { getDataType } from "../utils";
import TextBox, { TTextBox } from "./TextBox";
import TB, { TTextBox as TTTextBox } from "../basic/TextBox";
import { EVENT_UPDATE } from "../event";

const VALUE_COLOR = "green";

export default class ValueEditor extends TextBox {
  valueType: "string" | "object" | "array" = "string";
  textbox?: TTTextBox;
  text: string | object | any[];

  constructor(
    text: string | object | any[],
    x: number,
    y: number,
    graph: Graph
  ) {
    const valueType = getDataType(text);
    let a;
    switch (valueType) {
      case "object":
        a = "{}";
        break;
      case "array":
        a = "[]";
        break;
      default:
        a = text;
        break;
    }
    super({ x, y, text: a as string, style: { color: VALUE_COLOR } }, graph);
    this.text = a;
    this.valueType = valueType;
  }

  render(x: number, y: number) {
    if (!this.graph) return;
    this.x = x ?? this.x;
    this.y = y ?? this.y;
    this.text = new TB(
      {
        x: this.x,
        y: this.y,
        text: this.text as string,
        width: this.width,
        height: this.height,
        style: {
          color: VALUE_COLOR,
        },
      },
      this.graph
    );
  }

  front() {
    if (!this.textbox) return;
    this.textbox.front();
  }
  get value() {
    return this.textbox?.text;
  }
  initEvnet() {
    this.text?.on(EVENT_EDITING, () => {
      // this.parent.changed();
      this.graph.emit(EVENT_UPDATE, {
        name: "updateText",
      });
    });
    this.text?.on("mousedown", (event) => {
      if (!this.parent) return;
      event = event as MouseEvent;
      event.stopPropagation();
      this.graph.isLinking = true;

      let tempLine: Line | null = null;
      const svgPoint = (this.canvas.node as SVGSVGElement).createSVGPoint();
      const startPos = getRightMid(this);

      tempLine = this.canvas
        .line(startPos.x, startPos.y, startPos.x, startPos.y)
        .stroke({ width: 2, color: "#000" });

      const mousemove = (e: MouseEvent) => {
        e.preventDefault();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const cursor = svgPoint.matrixTransform(
          (this.canvas.node as SVGSVGElement).getScreenCTM()?.inverse()
        );
        tempLine?.plot(startPos.x, startPos.y, cursor.x, cursor.y);

        for (const objectBox of this.graph.objectBoxes) {
          if (
            isPointInBox({ x: cursor.x, y: cursor.y }, objectBox) &&
            objectBox !== this.parent?.parent
          ) {
            highlightRect(objectBox.rect);
          } else {
            unHighlightRect(objectBox.rect);
          }
        }

        tempLine?.front();
      };

      const mouseup = (e: MouseEvent) => {
        this.graph.isLinking = false;

        const cursor = svgPoint.matrixTransform(
          (this.canvas.node as SVGSVGElement).getScreenCTM()?.inverse()
        );
        const objectBox = this.graph.objectBoxes.find((box) =>
          isPointInBox({ x: cursor.x, y: cursor.y }, box)
        );

        if (objectBox) {
          unHighlightRect(objectBox?.rect);
        }

        if (objectBox && this.parent?.child !== objectBox) {
          this.graph.emit(EVENT_LINK, {
            keyvalueBox: this.parent,
            objectBox: objectBox,
          });
          // this.parent.setValue();
        }

        tempLine?.remove();
        tempLine = null;
        document.removeEventListener("mousemove", mousemove);
        document.removeEventListener("mouseup", mouseup);
      };

      document.addEventListener("mousemove", mousemove);
      document.addEventListener("mouseup", mouseup);
    });
  }

  updateText(newText: string): void {
    this.textbox.updateText(newText);
    this.graph.emit(EVENT_UPDATE, {
      name: "updateText",
      value: newText,
      self: this,
    });
  }
}
