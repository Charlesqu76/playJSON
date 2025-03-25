import Graph from "..";
import { TLine } from "../basic/Line";
import { TKeyvalueBox } from "../basic2/KeyValueBox";
import { TObjectBox } from "../basic2/ObjectBox";

export default function select(
  graph: Graph,
  item: TLine | TKeyvalueBox | TObjectBox
) {
  if (item !== graph.selectedItem) {
    graph.selectedItem?.unHighlight();
  }
  item.highlight();
  graph.selectedItem = item;
}
