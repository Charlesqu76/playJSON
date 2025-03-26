import Graph from "..";
import { TLine } from "../basic/Line";

export default function unlink(graph: Graph, line: TLine) {
  if (graph.canvas === null || !line) return;
  line.keyValueBox.unlink();
  line.objectBox.unlink();
}
