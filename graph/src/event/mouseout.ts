import Graph from "..";
import { TLine } from "../basic/Line";
import { TKeyvalueBox } from "../component/keyValueBox";
import { TObjectBox } from "../component/ObjectBox";

export default function mouseout(
  graph: Graph,
  item: TLine | TKeyvalueBox | TObjectBox
) {
  if (graph.selectedItem === item) return;
  item.unHighlight();
}
