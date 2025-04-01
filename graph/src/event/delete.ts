import Graph from "..";
import Line, { TLine } from "../basic/Line";
import { TKeyvalueBox } from "../component/keyValueBox";
import { TObjectBox } from "../component/ObjectBox";

export default function deleteItem(
  graph: Graph,
  item: TLine | TObjectBox | TKeyvalueBox
) {
  if (!item) return;
  if (item instanceof Line) {
    item.unlink();
  } else {
    item.delete();
  }
}
