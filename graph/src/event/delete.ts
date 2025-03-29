import Graph from "..";
import Line, { TLine } from "@/basic/Line";
import { TKeyvalueBox } from "@/basic2/keyValueBox";
import { TObjectBox } from "@/basic2/ObjectBox";

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
