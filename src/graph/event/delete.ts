import Graph from "..";
import Line, { TLine } from "../basic/Line";
import { TKeyvalueBox } from "../basic2/KeyValueBox";
import { TObjectBox } from "../basic2/ObjectBox";
import { EVENT_UNLINK } from "../event";

export default function deleteItem(
  graph: Graph,
  item: TLine | TObjectBox | TKeyvalueBox
) {
  if (!item) return;
  if (item instanceof Line) {
    graph.emit(EVENT_UNLINK, { line: item });
  } else {
    item.delete();
  }
}
