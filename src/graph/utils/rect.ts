import { Rect } from "@svgdotjs/svg.js";

export function highlightRect(rect: Rect) {
  rect.attr({ "stroke-width": 3, stroke: "red" });
}

export function unHighlightRect(rect: Rect) {
  rect.attr({ "stroke-width": 1, stroke: "black" });
}
