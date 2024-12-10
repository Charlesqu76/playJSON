import { Svg } from "@svgdotjs/svg.js";
import ObjectBox from "./ObjectBox";
import Line from "./basic/Line";
import { getControlPoints } from "./utils";
import Graph from "./graph";
import ObjectSign from "./ObjectSign";
import { EVENT_MOVE, EVENT_SELECT, EVENT_UPDATE } from "@/garph/event";

export default class LinkLine extends Line {
  keyValueBox: ObjectSign;
  objectBox: ObjectBox;
  graph: Graph;

  constructor(draw: Svg, start: ObjectSign, end: ObjectBox, graph: Graph) {
    super(draw, {});
    this.graph = graph;
    this.keyValueBox = start;
    this.objectBox = end;
    this.path.on("click", () => {
      this.graph.emit(EVENT_SELECT, { item: this });
    });

    this.link();

    this.path.plot(
      getControlPoints(this.keyValueBox.boundary, this.objectBox.boundary)
    );
  }

  update = () => {
    this.path.plot(
      getControlPoints(this.keyValueBox.boundary, this.objectBox.boundary)
    );
  };

  link() {
    this.keyValueBox.child = this.objectBox;
    this.objectBox.setParent(this.keyValueBox.parent);
    this.keyValueBox.line = this;
    this.objectBox.line = this;
    this.keyValueBox.eventEmitter.on(EVENT_MOVE, this.update);
    this.objectBox.eventEmitter.on(EVENT_MOVE, this.update);
    this.graph.emit(EVENT_UPDATE, { name: "link" });
  }

  delete() {
    this.path.remove();
    this.keyValueBox.child = null;
    this.objectBox.setParent(null);
    this.keyValueBox.line = null;
    this.objectBox.line = null;
    this.keyValueBox.eventEmitter.off(EVENT_MOVE, this.update);
    this.objectBox.eventEmitter.off(EVENT_MOVE, this.update);
    this.graph.emit(EVENT_UPDATE, { name: "delete" });
  }
}
