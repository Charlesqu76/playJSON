import Graph from "..";
import KeyValueBox from "../keyvalueBox";

export default function unlink(graph: Graph, keyvalueBox: KeyValueBox) {
  if (!keyvalueBox) return;
  if (graph.canvas === null) return;
  if (keyvalueBox.line) {
    keyvalueBox.line.delete();
  }
}
