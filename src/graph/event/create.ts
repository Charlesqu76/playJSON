import Graph from "..";
import KeyValueBox from "../keyvalueBox";
import ObjectBox from "../ObjectBox";
export default function create(graph: Graph, item: ObjectBox | KeyValueBox) {
  console.log("create", item.constructor.name);
  if (item instanceof ObjectBox) {
    graph.addObjectBox(item);
  }

  if (item instanceof KeyValueBox) {
    graph.addKeyValueBox(item);
  }
}
