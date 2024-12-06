import { Svg } from "@svgdotjs/svg.js";
import { Box } from "./box";
import KeyValueBox from "./KeyValueBox";
import ObjectBox from "./ObjectBox";
import Line from "./Line";
import { getControlPoints } from "./utils";
import ObjectSign from "./ObjectSign";

export default class LinkLine extends Line {
  keyValueBox: ObjectSign;
  objectBox: ObjectBox;
  private keydownHandler: (event: KeyboardEvent) => void;
  private moveHandler: () => void;

  constructor(draw: Svg, start: ObjectSign, end: ObjectBox, options = {}) {
    super(draw, options);
    this.keyValueBox = start;
    this.objectBox = end;
    this.keyValueBox.child = this.objectBox;
    this.objectBox.setParent(this.keyValueBox);
    this.path.plot(
      getControlPoints(this.keyValueBox.boundary, this.objectBox.boundary)
    );

    this.keydownHandler = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === "Delete" || event.key === "Backspace") &&
        Line.lastClickedLine === this
      ) {
        this.remove();
      }
    };

    this.moveHandler = () => this.update();
    this.keyValueBox.eventEmitter.on("move", this.moveHandler);
    this.objectBox.eventEmitter.on("move", this.moveHandler);
    document.addEventListener("keydown", this.keydownHandler);
  }

  remove = () => {
    this.keyValueBox.eventEmitter.off("move", this.moveHandler);
    this.objectBox.eventEmitter.off("move", this.moveHandler);
    document.removeEventListener("keydown", this.keydownHandler);

    if (Line.lastClickedLine === this) {
      Line.lastClickedLine = null;
    }
    this.objectBox.setParent(null);
    this.keyValueBox.child = null;
    this.path.remove();
    this.keyValueBox.line = null;
  };

  update = () => {
    this.path.plot(
      getControlPoints(this.keyValueBox.boundary, this.objectBox.boundary)
    );
  };

  checkValid = (start: KeyValueBox, end: ObjectBox) => {
    if (end.parent) {
      return false;
    }
  };

  breakLink = () => {
    this.keyValueBox.child = null;
    this.objectBox.setParent(null);
    this.path.remove();
  };
}
