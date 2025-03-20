import Graph from "..";
import KeyValueBox from "../keyvalueBox";
import LinkLine from "../LinkLine";
import ObjectBox from "../ObjectBox";

export default function mouseover(
  graph: Graph,
  item: LinkLine | KeyValueBox | ObjectBox
) {
  if (graph.isLinking || graph.isKeyvvalueBoxMoving) return;
  if (item instanceof LinkLine) {
    item.path.attr({ cursor: "pointer" });
    item.path.stroke({ color: "red", width: 3 });
  } else {
    item.front();
    item.rect.attr({ cursor: "pointer", "stroke-width": 3, stroke: "red" });
  }
}
