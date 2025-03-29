import Graph from "..";
import Line, { TLine } from "@/basic/Line";
import { TKeyvalueBox } from "@/basic2/keyValueBox";
import { TObjectBox } from "@/basic2/ObjectBox";

export default function mouseover(
  graph: Graph,
  item: TLine | TKeyvalueBox | TObjectBox
) {
  if (graph.isLinking || graph.isKeyvvalueBoxMoving) return;
  item.highlight();
  if (item instanceof Line) {
    item.path.attr({ cursor: "pointer" });
  } else {
    item.front();
  }
}
