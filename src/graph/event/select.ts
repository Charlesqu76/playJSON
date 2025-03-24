import Graph from "..";
import { TKeyvalueBox } from "../basic2/KeyValueBox";
import { TObjectBox } from "../basic2/ObjectBox";
import LinkLine from "../LinkLine";

export default function select(
  graph: Graph,
  item: LinkLine | TKeyvalueBox | TObjectBox
) {
  console.log("asdf");
  if (item !== graph.selectedItem) {
    graph.selectedItem?.unHighlight();
  }
  item.highlight();
  graph.selectedItem = item;
}
