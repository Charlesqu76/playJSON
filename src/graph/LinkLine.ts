import ObjectBox from "./ObjectBox";
import Line from "./basic/Line";
import { getControlPoints } from "./utils";
import Graph from ".";
import {
  EVENT_MOUSEOUT,
  EVENT_MOUSEOVER,
  EVENT_MOVE,
  EVENT_SELECT,
  EVENT_UPDATE,
} from "@/graph/event";
import KeyValueBox from "./keyvalueBox";
import { TKeyvalueBox } from "./basic2/KeyValueBox";
import { TObjectBox } from "./basic2/ObjectBox";

export default class LinkLine extends Line {
  keyValueBox: TKeyvalueBox;
  objectBox: TObjectBox;
  graph: Graph;

  constructor(keyValueBox: TKeyvalueBox, objectBox: TObjectBox, graph: Graph) {
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

  render() {}

  update = () => {
    this.path.plot(getControlPoints(this.keyValueBox, this.objectBox));
  };

  link() {
    this.keyValueBox.on(EVENT_MOVE, this.update);
    this.objectBox.on(EVENT_MOVE, this.update);
    this.graph.emit(EVENT_UPDATE, { name: "link" });
  }

  unlink() {
    console.log("asdfsadf");
    this.keyValueBox.off(EVENT_MOVE, this.update);
    this.objectBox.off(EVENT_MOVE, this.update);
    this.graph.emit(EVENT_UPDATE, { name: "unlink" });
    this.delete();
  }

  delete() {
    this.path.remove();
    this.graph.emit(EVENT_UPDATE, { name: "delete" });
  }
}
