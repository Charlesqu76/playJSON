import Graph from "..";
import { TLine } from "../basic/Line";
import { TKeyvalueBox } from "../component/keyValueBox";
import { TObjectBox } from "../component/ObjectBox";

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
