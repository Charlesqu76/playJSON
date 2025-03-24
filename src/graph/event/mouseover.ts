import Graph from "..";
import { TKeyvalueBox } from "../basic2/KeyValueBox";
import { TObjectBox } from "../basic2/ObjectBox";
import LinkLine from "../LinkLine";

export default function mouseover(
  graph: Graph,
  item: LinkLine | TKeyvalueBox | TObjectBox
) {
  if (graph.isLinking || graph.isKeyvvalueBoxMoving) return;
  item.highlight();
  if (item instanceof LinkLine) {
    item.path.attr({ cursor: "pointer" });
  } else {
    item.front();
  }
}
