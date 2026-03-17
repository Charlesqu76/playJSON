import { ActiveAttrDrag, AttrDragMode } from "../../types/node";

export const getAttrHandleId = (sourceAttrKey: string): string =>
  `attr-${encodeURIComponent(sourceAttrKey)}`;

export const parseAttrDragPayload = (raw: string): ActiveAttrDrag | null => {
  try {
    const parsed = JSON.parse(raw) as {
      mode?: unknown;
      sourceBlockId?: unknown;
      sourceAttrKey?: unknown;
    };
    if (
      typeof parsed.sourceBlockId !== "string" ||
      typeof parsed.sourceAttrKey !== "string"
    ) {
      return null;
    }
    const mode: AttrDragMode = parsed.mode === "move" ? "move" : "link";
    return {
      mode,
      sourceBlockId: parsed.sourceBlockId,
      sourceAttrKey: parsed.sourceAttrKey,
    };
  } catch {
    return null;
  }
};
