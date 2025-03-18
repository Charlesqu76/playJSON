import Graph from "../graph";
import KeyValueBox from "../keyvalueBox";
import LinkLine from "../LinkLine";
import ObjectBox from "../ObjectBox";

export default function deleteItem(
  graph: Graph,
  item: LinkLine | ObjectBox | KeyValueBox
) {
  if (!item) return;
  item.delete();
}
