import ObjectBox from "./ObjectBox";
import Line from "./basic/Line";
import { getControlPoints } from "./utils";
import Graph from "./graph";
import {
  EVENT_MOUSEOUT,
  EVENT_MOUSEOVER,
  EVENT_MOVE,
  EVENT_SELECT,
  EVENT_UPDATE,
} from "@/garph/event";
import KeyValueBox from "./keyvalueBox";

export default class LinkLine extends Line {
  keyValueBox: KeyValueBox;
  objectBox: ObjectBox;
  graph: Graph;

  constructor(keyValueBox: KeyValueBox, objectBox: ObjectBox, graph: Graph) {
    super({}, graph);
    this.graph = graph;
    this.keyValueBox = keyValueBox;
    this.objectBox = objectBox;
    this.initEvent();
    this.link();

    this.path.plot(getControlPoints(this.keyValueBox, this.objectBox));
  }

  initEvent() {
    this.path.on("click", () => {
      this.graph.emit(EVENT_SELECT, { item: this });
    });

    this.path.on("mouseover", () => {
      this.graph.emit(EVENT_MOUSEOVER, { item: this });
    });

    this.path.on("mouseout", () => {
      this.graph.emit(EVENT_MOUSEOUT, { item: this });
    });
  }

  update = () => {
    this.path.plot(getControlPoints(this.keyValueBox, this.objectBox));
  };

  link() {
    this.keyValueBox.setChild(this.objectBox);
    this.objectBox.setParent(this.keyValueBox);
    this.keyValueBox.setLine(this);
    this.objectBox.setLine(this);
    this.keyValueBox.on(EVENT_MOVE, this.update);
    this.objectBox.on(EVENT_MOVE, this.update);
    this.graph.emit(EVENT_UPDATE, { name: "link" });
    this.graph.linkLines.add(this);
  }

  delete() {
    this.path.remove();
    this.keyValueBox.setChild(null);
    this.objectBox.setParent(null);
    this.keyValueBox.setLine(null);
    this.objectBox.setLine(null);
    this.keyValueBox.valueBox.updateText("null");
    this.keyValueBox.changed();
    this.keyValueBox.off(EVENT_MOVE, this.update);
    this.objectBox.off(EVENT_MOVE, this.update);
    this.graph.linkLines.delete(this);
    this.graph.emit(EVENT_UPDATE, { name: "delete" });
  }
}
