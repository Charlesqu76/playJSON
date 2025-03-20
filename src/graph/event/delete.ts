import Graph from "..";
import { EVENT_UNLINK } from "../event";
import KeyValueBox from "../keyvalueBox";
import LinkLine from "../LinkLine";
import ObjectBox from "../ObjectBox";

export default function deleteItem(
  graph: Graph,
  item: LinkLine | ObjectBox | KeyValueBox
) {
  if (!item) return;
  if (item instanceof LinkLine) {
    graph.emit(EVENT_UNLINK, { line: item });
  } else {
    item.delete();
  }
}
