import Graph from "..";
import { getDataType } from "../utils";
import TextBox from "./TextBox";
import TB, { TTextBox as TTTextBox } from "../basic/TextBox";
import { EVENT_EDITING } from "./TextEditor";

const VALUE_COLOR = "green";
export type TValueEditor = ValueEditor;

export default class ValueEditor extends TextBox {
  valueType: "string" | "object" | "array" = "string";
  textBox?: TTTextBox;
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
    this.textBox = new TB(
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

    this.initEvnet();
  }

  front() {
    if (!this.textBox) return;
    this.textBox.front();
  }
  back() {
    if (!this.textBox) return;
    this.textBox.back();
  }

  get value() {
    return this.textBox?.value;
  }
  initEvnet() {
    this.textBox?.text.on(EVENT_EDITING, (event) => {
      const { width = 0, height = 0 } = this.textBox?.boundary || {};
      this.width = width;
      this.height = height;
    });
    // this.text?.on("mousedown", (event) => {
    //   if (!this.parent) return;
    //   event = event as MouseEvent;
    //   event.stopPropagation();
    //   this.graph.isLinking = true;
    //   let tempLine: Line | null = null;
    //   const svgPoint = (this.canvas.node as SVGSVGElement).createSVGPoint();
    //   const startPos = getRightMid(this);
    //   tempLine = this.canvas
    //     .line(startPos.x, startPos.y, startPos.x, startPos.y)
    //     .stroke({ width: 2, color: "#000" });
    //   const mousemove = (e: MouseEvent) => {
    //     e.preventDefault();
    //     svgPoint.x = e.clientX;
    //     svgPoint.y = e.clientY;
    //     const cursor = svgPoint.matrixTransform(
    //       (this.canvas.node as SVGSVGElement).getScreenCTM()?.inverse()
    //     );
    //     tempLine?.plot(startPos.x, startPos.y, cursor.x, cursor.y);
    //     for (const objectBox of this.graph.objectBoxes) {
    //       if (
    //         isPointInBox({ x: cursor.x, y: cursor.y }, objectBox) &&
    //         objectBox !== this.parent?.parent
    //       ) {
    //         highlightRect(objectBox.rect);
    //       } else {
    //         unHighlightRect(objectBox.rect);
    //       }
    //     }
    //     tempLine?.front();
    //   };
    //   const mouseup = (e: MouseEvent) => {
    //     this.graph.isLinking = false;
    //     const cursor = svgPoint.matrixTransform(
    //       (this.canvas.node as SVGSVGElement).getScreenCTM()?.inverse()
    //     );
    //     const objectBox = this.graph.objectBoxes.find((box) =>
    //       isPointInBox({ x: cursor.x, y: cursor.y }, box)
    //     );
    //     if (objectBox) {
    //       unHighlightRect(objectBox?.rect);
    //     }
    //     if (objectBox && this.parent?.child !== objectBox) {
    //       this.graph.emit(EVENT_LINK, {
    //         keyvalueBox: this.parent,
    //         objectBox: objectBox,
    //       });
    //       // this.parent.setValue();
    //     }
    //     tempLine?.remove();
    //     tempLine = null;
    //     document.removeEventListener("mousemove", mousemove);
    //     document.removeEventListener("mouseup", mouseup);
    //   };
    //   document.addEventListener("mousemove", mousemove);
    //   document.addEventListener("mouseup", mouseup);
    // });
  }

  updateText(newText: string): void {
    // this.textbox.updateText(newText);
    // this.graph.emit(EVENT_UPDATE, {
    //   name: "updateText",
    //   value: newText,
    //   self: this,
    // });
  }
}
