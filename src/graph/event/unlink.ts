import Graph from "..";
import LinkLine from "../LinkLine";

export default function unlink(graph: Graph, line: LinkLine) {
  console.log("unlink");
  if (graph.canvas === null || !line) return;
  line.keyValueBox.unlink();
  line.objectBox.unlink();
  line.delete();
}
