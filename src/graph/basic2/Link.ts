import Graph from "..";
import Line, { TLine } from "../basic/Line";
import { TKeyvalueBox } from "./KeyValueBox";
import { TObjectBox } from "./ObjectBox";

export type TLink = Link;

export default class Link {
  keyValueBox: TKeyvalueBox;
  objectBox: TObjectBox;
  graph: Graph;
  line?: TLine | null;

  constructor(keyValueBox: TKeyvalueBox, objectBox: TObjectBox, graph: Graph) {
    this.graph = graph;
    this.keyValueBox = keyValueBox;
    this.objectBox = objectBox;
    // this.keyValueBox.link(this.objectBox);
    // this.objectBox.link(this, this.keyValueBox);
  }
  render() {
    this.line = new Line(this.keyValueBox, this.objectBox, this.graph);
  }

  update() {
    this.line?.update();
  }

  link() {
    this.line?.link();
  }

  unlink() {
    this.line?.unlink();
    this.line = null;
  }

  delete() {
    this.line?.delete();
  }

  show() {
    this.line?.show();
  }

  front() {
    this.line?.front();
  }

  hide() {
    this.line?.hide();
  }

  highlight() {
    this.line?.highlight();
  }

  unHighlight() {
    this.line?.unHighlight();
  }
}
