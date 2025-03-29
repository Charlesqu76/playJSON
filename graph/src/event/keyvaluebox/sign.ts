import { TKeyvalueBox } from "@/component/keyValueBox";
import { getRightMid, isPointInBox } from "../../utils";
import { Line } from "@svgdotjs/svg.js";

export function signLink(keyvalueBox: TKeyvalueBox) {
  keyvalueBox.sign?.sign.on("mousedown", (event) => {
    link(event as MouseEvent, keyvalueBox);
  });
}

export function link(event: MouseEvent, keyvalueBox: TKeyvalueBox) {
  if (!keyvalueBox.parent || !keyvalueBox.graph.canvas || !keyvalueBox.sign)
    return;
  // event.stopPropagation();
  keyvalueBox.graph.isLinking = true;
  let tempLine: Line | null = null;
  const svgPoint = (
    keyvalueBox.graph?.canvas?.node as SVGSVGElement
  ).createSVGPoint();
  const startPos = getRightMid(keyvalueBox.sign);
  tempLine = keyvalueBox.graph.canvas
    .line(startPos.x, startPos.y, startPos.x, startPos.y)
    .stroke({ width: 2, color: "#000" });

  const mousemove = (e: MouseEvent) => {
    e.preventDefault();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    const cursor = svgPoint.matrixTransform(
      (keyvalueBox.graph.canvas?.node as SVGSVGElement)
        .getScreenCTM()
        ?.inverse()
    );
    tempLine?.plot(startPos.x, startPos.y, cursor.x, cursor.y);
    for (const objectBox of keyvalueBox.graph.objectBoxes) {
      if (
        isPointInBox({ x: cursor.x, y: cursor.y }, objectBox) &&
        objectBox !== keyvalueBox.parent
      ) {
        objectBox.highlight();
      } else {
        objectBox.unHighlight();
      }
    }
    tempLine?.front();
  };

  const mouseup = (e: MouseEvent) => {
    keyvalueBox.graph.isLinking = false;
    tempLine?.remove();
    tempLine = null;
    const cursor = svgPoint.matrixTransform(
      (keyvalueBox.graph.canvas?.node as SVGSVGElement)
        .getScreenCTM()
        ?.inverse()
    );
    const objectBox = Array.from(keyvalueBox.graph.objectBoxes).find((box) =>
      isPointInBox({ x: cursor.x, y: cursor.y }, box)
    );
    if (objectBox) {
      objectBox.unHighlight();
    }
    if (objectBox && keyvalueBox.child !== objectBox) {
      objectBox.link(keyvalueBox);
    }

    document.removeEventListener("mousemove", mousemove);
    document.removeEventListener("mouseup", mouseup);
  };

  document.addEventListener("mousemove", mousemove);
  document.addEventListener("mouseup", mouseup);
}
