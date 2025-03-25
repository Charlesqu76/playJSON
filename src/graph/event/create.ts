import Graph from "..";
import KeyValueBox, { TKeyvalueBox } from "../basic2/KeyValueBox";
import ObjectBox, { TObjectBox } from "../basic2/ObjectBox";
export default function create(graph: Graph, item: TObjectBox | TKeyvalueBox) {
  if (item instanceof ObjectBox) {
    graph.addObjectBox(item);
  }

  if (item instanceof KeyValueBox) {
    graph.addKeyValueBox(item);
  }
}
