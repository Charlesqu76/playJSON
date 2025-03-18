import { Rect } from "@svgdotjs/svg.js";

export function highlightRect<T>(rect: Rect) {
  rect.attr({ "stroke-width": 3, stroke: "red" });
}

export function unHighlightRect<T>(rect: Rect) {
  rect.attr({ "stroke-width": 1, stroke: "black" });
}
