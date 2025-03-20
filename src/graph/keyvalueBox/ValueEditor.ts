import Graph from "..";
import { getDataType, getRightMid, isPointInBox } from "../utils";
import TextBox from "../basic/TextBox";
import { EVENT_LINK, EVENT_UNLINK, EVENT_UPDATE } from "../event";
import { Line } from "@svgdotjs/svg.js";
import KeyValueBox from ".";
import { highlightRect, unHighlightRect } from "../utils/rect";

const VALUE_COLOR = "green";

export default class ValueEdit extends TextBox<KeyValueBox> {
  valueType: "string" | "object" | "array" = "string";
  parent: KeyValueBox;
  constructor(
    text: string | object | any[],
    x: number,
    y: number,
    graph: Graph,
    parent: KeyValueBox
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
    super({ x, y, text: a as string }, graph);
    this.valueType = valueType;
    this.parent = parent || null;
    this.text.text.fill(VALUE_COLOR);

    this.initEvnet();
  }

  initEvnet() {
    this.text.text.on("dblclick", (e) => {
      const v = prompt("dblclick");
      if (!v) return;
      this.graph?.emit(EVENT_UNLINK, {
        keyvalueBox: this.parent,
        line: this.parent.line,
      });
      this.updateText(v);
    });

    this.text.text.on("mousedown", (event) => {
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
            objectBox !== this.parent.parent
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

        if (objectBox && this.parent.child !== objectBox) {
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
    super.updateText(newText);
    this.graph.emit(EVENT_UPDATE, {
      name: "updateText",
      value: newText,
      self: this,
    });
  }
}
