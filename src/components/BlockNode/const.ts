import { CSSProperties } from "react";

export const ATTR_MOVE_MIME = "application/x-json-attr-move";
export const ATTR_LINK_MIME = "application/x-json-attr-link";

export const twoLineClampStyle: CSSProperties = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
};
