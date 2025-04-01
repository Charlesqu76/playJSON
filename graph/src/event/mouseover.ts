import Graph from "..";
import Line, { TLine } from "../basic/Line";
import { TKeyvalueBox } from "../component/keyValueBox";
import { TObjectBox } from "../component/ObjectBox";

export default function mouseover(
  graph: Graph,
  item: TLine | TKeyvalueBox | TObjectBox
) {
  if (graph.isLinking || graph.isKeyvvalueBoxMoving) return;
  if (item instanceof Line) {
    // item.path.attr({ cursor: "pointer" });
  } else {
    item.front();
  }
}
