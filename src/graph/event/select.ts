import Graph from "..";
import KeyValueBox from "../keyvalueBox";
import LinkLine from "../LinkLine";
import ObjectBox from "../ObjectBox";

export default function select(
  graph: Graph,
  item: LinkLine | KeyValueBox | ObjectBox
) {
  if (item !== graph.selectedItem) {
    graph.selectedItem?.unselect();
  }
  item.select();
  graph.selectedItem = item;
}
