import { Svg } from "@svgdotjs/svg.js";
import { Box } from "./box";
import KeyValueBox from "./KeyValueBox";
import ObjectBox from "./ObjectBox";
import Line from "./Line";
import { getControlPoints } from "./utils";
import ObjectSign from "./ObjectSign";
import Graph, { EVENT_UPDATE } from "./graph";

export default class LinkLine extends Line {
  keyValueBox: ObjectSign;
  objectBox: ObjectBox;
  graph: Graph;
  private keydownHandler: (event: KeyboardEvent) => void;
  private moveHandler: () => void;

  constructor(draw: Svg, start: ObjectSign, end: ObjectBox, graph: Graph) {
    super(draw, {});
    this.graph = graph;
    this.keyValueBox = start;
    this.objectBox = end;
    this.keyValueBox.child = this.objectBox;
    this.keyValueBox.line = this;
    this.objectBox.line = this;
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
    this.breakLink();
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
    console.log("asdfasdf");
    this.keyValueBox.child = null;
    this.objectBox.setParent(null);
    this.path.remove();
    this.graph.eventEmitter.emit(EVENT_UPDATE, { name: "breakLink" });
    this.keyValueBox.line = null;
  };
}
