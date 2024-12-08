import { Svg } from "@svgdotjs/svg.js";
import KeyValueBox from "./KeyValueBox";
import ObjectBox from "./ObjectBox";
import Line from "./basic/Line";
import { getControlPoints } from "./utils";
import Graph, { EVENT_UPDATE } from "./graph";

export const EVENT_MOVE = Symbol("move");
export const EVENT_DELETE = Symbol("delete");

export default class LinkLine extends Line {
  keyValueBox: KeyValueBox;
  objectBox: ObjectBox;
  graph: Graph;
  private keydownHandler: (event: KeyboardEvent) => void;
  private moveHandler: () => void;

  constructor(draw: Svg, start: KeyValueBox, end: ObjectBox, graph: Graph) {
    super(draw, {});
    this.graph = graph;
    this.keyValueBox = start;
    this.objectBox = end;
    this.keyValueBox.valueBox.child = this.objectBox;
    this.keyValueBox.valueBox.line = this;
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
    this.keyValueBox.eventEmitter.on(EVENT_MOVE, this.moveHandler);
    this.objectBox.eventEmitter.on(EVENT_MOVE, this.moveHandler);
    this.keyValueBox.eventEmitter.on(EVENT_DELETE, this.remove);
    this.objectBox.eventEmitter.on(EVENT_DELETE, this.remove);

    document.addEventListener("keydown", this.keydownHandler);
  }

  remove = () => {
    this.keyValueBox.eventEmitter.off(EVENT_MOVE, this.moveHandler);
    this.objectBox.eventEmitter.off(EVENT_MOVE, this.moveHandler);
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
    this.keyValueBox.valueBox.child = null;
    this.objectBox.setParent(null);
    this.path.remove();
    this.graph.eventEmitter.emit(EVENT_UPDATE, { name: "breakLink" });
    this.keyValueBox.valueBox.line = null;
  };
}
