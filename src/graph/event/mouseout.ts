import Graph from "..";
import { TLine } from "../basic/Line";
import { TKeyvalueBox } from "../basic2/keyValueBox/KeyValueBox";
import { TObjectBox } from "../basic2/ObjectBox";

export default function mouseout(
  graph: Graph,
  item: TLine | TKeyvalueBox | TObjectBox
) {
  if (graph.selectedItem === item) return;
  item.unHighlight();
}
