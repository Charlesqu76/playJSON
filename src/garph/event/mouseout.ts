import Graph from "../graph";
import KeyValueBox from "../keyvalueBox";
import LinkLine from "../LinkLine";
import ObjectBox from "../ObjectBox";

export default function mouseout(
  graph: Graph,
  item: LinkLine | KeyValueBox | ObjectBox
) {
  if (graph.selectedItem === item) return;
  if (item instanceof LinkLine) {
    item.path.attr({ cursor: "pointer", "stroke-width": 1, stroke: "black" });
  } else {
    item.rect.attr({ "stroke-width": 1, stroke: "black" });
  }
}
