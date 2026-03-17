import { CSSProperties } from "react";

export const ATTR_MOVE_MIME = "application/x-json-attr-move";
export const ATTR_LINK_MIME = "application/x-json-attr-link";

export const twoLineClampStyle: CSSProperties = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
};

export enum ValueTypeColor {
  String = "#2d8f4e",
  Number = "#6b4c9a",
  Boolean = "#c76b29",
  Null = "#6b7280",
  Undefined = "#9ca3af",
  Other = "inherit",
}

export type ValueType = "string" | "number" | "boolean" | "null" | "undefined" | "other";

export const detectValueType = (value: unknown): ValueType => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "other";
};

export const getValueColor = (value: unknown): ValueTypeColor => {
  const type = detectValueType(value);
  switch (type) {
    case "string":
      return ValueTypeColor.String;
    case "number":
      return ValueTypeColor.Number;
    case "boolean":
      return ValueTypeColor.Boolean;
    case "null":
      return ValueTypeColor.Null;
    case "undefined":
      return ValueTypeColor.Undefined;
    default:
      return ValueTypeColor.Other;
  }
};
