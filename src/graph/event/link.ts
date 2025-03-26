import { EVENT_UNLINK } from "../event";
import Graph from "..";
import { TKeyvalueBox } from "../basic2/KeyValueBox";
import { TObjectBox } from "../basic2/ObjectBox";
import linkVerify from "../utils/linkVerify";

export default function link(
  graph: Graph,
  payload: { keyvalueBox: TKeyvalueBox; objectBox: TObjectBox }
) {
  if (graph.canvas === null) return;
  const { keyvalueBox, objectBox } = payload;
  let verified = linkVerify(keyvalueBox, objectBox);
  if (!verified) {
    return;
  }

  if (keyvalueBox.child) {
    graph.emit(EVENT_UNLINK, { line: keyvalueBox.child.line });
  }

  objectBox.link(keyvalueBox);
  keyvalueBox.link(objectBox);
}
