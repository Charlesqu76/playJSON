import { useMemo } from "react";
import type { BlockLink, JsonBlock, JsonValue } from "../types/model";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";

interface JsonEditorProps {
  block: JsonBlock | null;
  allBlocks: JsonBlock[];
  links: BlockLink[];
}

const isRefObject = (value: JsonValue): value is { $ref: string } =>
  Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).$ref === "string",
  );

const resolveReferences = (
  value: JsonValue,
  blocksById: Map<string, JsonBlock>,
  seen: Set<string> = new Set(),
): JsonValue => {
  if (Array.isArray(value)) {
    return value.map((item) => resolveReferences(item, blocksById, seen));
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  if (isRefObject(value)) {
    const refId = value.$ref;
    if (seen.has(refId)) return value;
    const target = blocksById.get(refId);
    if (!target) return value;
    const nextSeen = new Set(seen);
    nextSeen.add(refId);
    return resolveReferences(target.data, blocksById, nextSeen);
  }
  const result: Record<string, JsonValue> = {};
  for (const [key, nested] of Object.entries(value)) {
    result[key] = resolveReferences(nested as JsonValue, blocksById, seen);
  }
  return result;
};

const JsonEditor = ({ block, allBlocks, links }: JsonEditorProps) => {
  const linkByAttrKey = useMemo(() => {
    if (!block) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const link of links) {
      if (link.sourceBlockId !== block.id || !link.sourceAttrKey) continue;
      map.set(link.sourceAttrKey, link.targetBlockId);
    }
    return map;
  }, [block, links]);

  const resolvedValue = useMemo(() => {
    if (!block) return null;
    const byId = new Map(
      allBlocks.map((candidate) => [candidate.id, candidate]),
    );
    let seeded = block.data;
    if (seeded && typeof seeded === "object" && !Array.isArray(seeded)) {
      const nextRoot: Record<string, JsonValue> = {
        ...(seeded as Record<string, JsonValue>),
      };
      for (const [attrKey, targetId] of linkByAttrKey.entries()) {
        const target = byId.get(targetId);
        if (!target) continue;
        nextRoot[attrKey] = target.data;
      }
      seeded = nextRoot;
    }
    return resolveReferences(seeded, byId, new Set([block.id]));
  }, [allBlocks, block, linkByAttrKey]);

  if (!block) {
    return (
      <div className="text-[0.9rem] text-[#6f655d]">Select a JSON block.</div>
    );
  }

  return (
    <div className="grid gap-[0.45rem]">
      <JsonView src={resolvedValue} className="max-w-lg" />
    </div>
  );
};

export default JsonEditor;
