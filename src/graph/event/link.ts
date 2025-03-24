import { EVENT_UNLINK } from "../event";
import Graph from "..";
import LinkLine from "../LinkLine";
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

  if (keyvalueBox.line) {
    graph.emit(EVENT_UNLINK, { line: keyvalueBox.line });
  }

  const line = new LinkLine(keyvalueBox, objectBox, graph);
  keyvalueBox.link(line, objectBox);
  objectBox.link(line, keyvalueBox);
  graph.addLinkLine(line);
}
