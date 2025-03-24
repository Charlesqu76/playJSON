import Graph from "..";
import { TKeyvalueBox } from "../basic2/KeyValueBox";
import { TObjectBox } from "../basic2/ObjectBox";
import LinkLine from "../LinkLine";

export default function mouseout(
  graph: Graph,
  item: LinkLine | TKeyvalueBox | TObjectBox
) {
  if (graph.selectedItem === item) return;
  item.unHighlight();
}
