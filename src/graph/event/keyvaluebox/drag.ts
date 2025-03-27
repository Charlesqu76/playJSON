import { EVENT_LINE_UPDATE } from "@/graph/basic/Line";
import { TKeyvalueBox } from "@/graph/basic2/keyValueBox/KeyValueBox";
import isOverlapping from "@/graph/utils/isOverlapping";

export function dragStart(keyvalyeBox: TKeyvalueBox) {
  keyvalyeBox.group?.on("dragstart", () => {
    keyvalyeBox.origin = keyvalyeBox.boundary;
    keyvalyeBox.graph.isKeyvvalueBoxMoving = true;
  });
}

export function dragMove(keyvalyeBox: TKeyvalueBox) {
  keyvalyeBox.group?.on(
    "dragmove",
    (event) => {
      keyvalyeBox.emit(EVENT_LINE_UPDATE);
      const { box } = (event as CustomEvent).detail;
      const overlapItem = keyvalyeBox.graph.objectBoxes.find((objectBox) => {
        return (
          isOverlapping(box, objectBox.boundary) &&
          objectBox !== keyvalyeBox.parent
        );
      });
      keyvalyeBox.graph.objectBoxes.forEach((objectBox) => {
        if (overlapItem === objectBox) {
          objectBox.highlight();
        } else {
          objectBox.unHighlight();
        }
      });
    },
    { passive: true }
  );
}

export function dragEnd(keyvalyeBox: TKeyvalueBox) {
  keyvalyeBox.group?.on("dragend", (event) => {
    const { box } = (event as CustomEvent).detail;

    setTimeout(() => {
      keyvalyeBox.graph.isKeyvvalueBoxMoving = false;
    }, 10);

    const overlapItem = keyvalyeBox.graph.objectBoxes.find((objectBox) => {
      const is = isOverlapping(box, objectBox.boundary);
      return is && objectBox !== keyvalyeBox.parent;
    });

    if (!overlapItem) {
      if (keyvalyeBox.origin) {
        keyvalyeBox.move(keyvalyeBox.origin.x, keyvalyeBox.origin.y);
      }
      return;
    }

    keyvalyeBox.group && overlapItem.group?.add(keyvalyeBox.group);
    keyvalyeBox.parent?.removeChildren(keyvalyeBox);
    overlapItem.addChildren(keyvalyeBox);
    keyvalyeBox.emit(EVENT_LINE_UPDATE);
  });
}
