import Graph from "..";
import KeyValueBox, { TKeyvalueBox } from "../component/keyValueBox";
import ObjectBox, { TObjectBox } from "../component/ObjectBox";
export default function create(graph: Graph, item: TObjectBox | TKeyvalueBox) {
  if (item instanceof ObjectBox) {
    graph.objectBoxes.add(item);
  } else if (item instanceof KeyValueBox) {
    graph.keyValueBoxes.add(item);
  }
}
