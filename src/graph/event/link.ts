import { EVENT_UNLINK } from "../event";
import Graph from "..";
import { TKeyvalueBox } from "../basic2/KeyValueBox";
import { TObjectBox } from "../basic2/ObjectBox";

export default function link(
  graph: Graph,
  payload: { keyvalueBox: TKeyvalueBox; objectBox: TObjectBox }
) {
  if (graph.canvas === null) return;
  const { keyvalueBox, objectBox } = payload;

  if (objectBox.parent) {
    alert("already linked");
    return;
  }

  objectBox.link(keyvalueBox);
  keyvalueBox.link(objectBox);

  // if (objectBox.line) {
  //   graph.emit(EVENT_UNLINK, { line: objectBox.line });
  // }

  // const line = new Link(keyvalueBox, objectBox, graph);
  // graph.addLinkLine(line);
}
