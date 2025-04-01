import { EVENT_LINE_UPDATE } from "../../basic/Line";
import { TKeyvalueBox } from "../../component/keyValueBox";
import { isOverlapping } from "../../utils/keyValueBox";

export function dragStart(keyvalyeBox: TKeyvalueBox) {
  keyvalyeBox.group?.on("dragstart", (e) => {
    keyvalyeBox.origin = keyvalyeBox.boundary;
    console.log("dragstart");
    e.stopPropagation();
  });
}

export function dragMove(keyvalyeBox: TKeyvalueBox) {
  keyvalyeBox.group?.on("dragmove", (event) => {
    keyvalyeBox.front();

    keyvalyeBox.graph.isKeyvvalueBoxMoving = true;
    keyvalyeBox.emit(EVENT_LINE_UPDATE);
    const { box } = (event as CustomEvent).detail;
    const overlapItem = Array.from(keyvalyeBox.graph.objectBoxes).find(
      (objectBox) => {
        return (
          isOverlapping(box, objectBox.boundary) &&
          objectBox !== keyvalyeBox.parent
        );
      }
    );
    keyvalyeBox.graph.objectBoxes.forEach((objectBox) => {
      if (overlapItem === objectBox) {
        objectBox.highlight();
      } else {
        objectBox.unHighlight();
      }
    });
  });
}

export function dragEnd(keyvalyeBox: TKeyvalueBox) {
  keyvalyeBox.group?.on("dragend", (event) => {
    if (!keyvalyeBox.graph.isKeyvvalueBoxMoving) return;
    const { box } = (event as CustomEvent).detail;

    setTimeout(() => {
      keyvalyeBox.graph.isKeyvvalueBoxMoving = false;
    }, 10);

    const overlapItem = Array.from(keyvalyeBox.graph.objectBoxes).find(
      (objectBox) => {
        const is = isOverlapping(box, objectBox.boundary);
        return (
          is &&
          objectBox !== keyvalyeBox.parent &&
          keyvalyeBox.child !== objectBox
        );
      }
    );

    if (!overlapItem) {
      keyvalyeBox.move(keyvalyeBox.x, keyvalyeBox.y);
      return;
    }

    keyvalyeBox.parent?.removeChildren(keyvalyeBox);
    overlapItem.addChildren(keyvalyeBox);
    overlapItem.unHighlight();
    keyvalyeBox.emit(EVENT_LINE_UPDATE);
  });
}
