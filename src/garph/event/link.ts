import { EVENT_UNLINK } from "../event";
import Graph from "../graph";
import KeyValueBox from "../keyvalueBox";
import LinkLine from "../LinkLine";
import ObjectBox from "../ObjectBox";

export default function link(
  graph: Graph,
  payload: { keyvalueBox: KeyValueBox; objectBox: ObjectBox }
) {
  if (graph.canvas === null) return;
  const { keyvalueBox, objectBox } = payload;
  if (objectBox.parent) {
    alert("already linked");
    return;
  }

  if (keyvalueBox.child) {
    graph.emit(EVENT_UNLINK, { keyvalueBox });
  }

  new LinkLine(keyvalueBox, objectBox, graph);
}
