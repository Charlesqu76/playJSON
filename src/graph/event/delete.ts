import Graph from "..";
import { TKeyvalueBox } from "../basic2/KeyValueBox";
import Link, { TLink } from "../basic2/Link";
import { TObjectBox } from "../basic2/ObjectBox";
import { EVENT_UNLINK } from "../event";

export default function deleteItem(
  graph: Graph,
  item: TLink | TObjectBox | TKeyvalueBox
) {
  if (!item) return;
  if (item instanceof Link) {
    graph.emit(EVENT_UNLINK, { line: item });
  } else {
    item.delete();
  }
}
