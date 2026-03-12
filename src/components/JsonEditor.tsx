import { useEffect, useMemo, useState } from "react";
import type { BlockLink, JsonBlock, JsonValue } from "../types/model";
import JsonView from "react18-json-view";
import { Button } from "./ui/button";
import { convertJsonToJsonSchema, convertJsonToTypeScriptType } from "../utils/json";
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

const toTypeName = (raw: string): string => {
  const cleaned = raw
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) =>
      part.length > 0
        ? `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`
        : "",
    )
    .join("");

  if (!cleaned) return "Root";
  return /^\d/.test(cleaned) ? `Type${cleaned}` : cleaned;
};

const JsonEditor = ({ block, allBlocks, links }: JsonEditorProps) => {
  const [activeTab, setActiveTab] = useState<"json" | "typescript" | "schema">("json");
  const [typeText, setTypeText] = useState<string>("");
  const [typeError, setTypeError] = useState<string | null>(null);
  const [isGeneratingType, setIsGeneratingType] = useState(false);
  const [schemaText, setSchemaText] = useState<string>("");
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [schemaStatus, setSchemaStatus] = useState<"idle" | "loading" | "ready">("idle");

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

  const typeName = useMemo(() => {
    if (!block) return "Root";
    return toTypeName(block.title);
  }, [block]);

  useEffect(() => {
    if (!block || resolvedValue === null) {
      setTypeText("");
      setTypeError(null);
      return;
    }

    let isCancelled = false;
    setIsGeneratingType(true);
    setTypeError(null);

    convertJsonToTypeScriptType(resolvedValue, typeName)
      .then((result) => {
        if (isCancelled) return;
        setTypeText(result.typeText);
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        setTypeError(
          error instanceof Error
            ? error.message
            : "Failed to generate TypeScript type.",
        );
        setTypeText("");
      })
      .finally(() => {
        if (isCancelled) return;
        setIsGeneratingType(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [block, resolvedValue, typeName]);

  useEffect(() => {
    setSchemaText("");
    setSchemaError(null);
    setSchemaStatus("idle");
  }, [block, resolvedValue, typeName]);

  useEffect(() => {
    if (!block || resolvedValue === null) return;
    if (activeTab !== "schema" || schemaStatus !== "idle") return;

    let isCancelled = false;
    setSchemaStatus("loading");
    setSchemaError(null);

    convertJsonToJsonSchema(resolvedValue, typeName)
      .then((result) => {
        if (isCancelled) return;
        setSchemaText(result.schemaText);
        setSchemaStatus("ready");
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        setSchemaError(
          error instanceof Error
            ? error.message
            : "Failed to generate JSON Schema.",
        );
        setSchemaText("");
        setSchemaStatus("ready");
      });

    return () => {
      isCancelled = true;
    };
  }, [activeTab, block, resolvedValue, schemaStatus, typeName]);

  if (!block) {
    return (
      <div className="text-[0.9rem] text-[#6f655d]">Select a JSON block.</div>
    );
  }

  return (
    <div className="grid gap-[0.45rem]">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={activeTab === "json" ? "default" : "outline"}
          onClick={() => setActiveTab("json")}
          type="button"
        >
          JSON
        </Button>
        <Button
          size="sm"
          variant={activeTab === "typescript" ? "default" : "outline"}
          onClick={() => setActiveTab("typescript")}
          type="button"
        >
          TypeScript Type
        </Button>
        <Button
          size="sm"
          variant={activeTab === "schema" ? "default" : "outline"}
          onClick={() => setActiveTab("schema")}
          type="button"
        >
          JSON Schema
        </Button>
      </div>

      {activeTab === "json" ? (
        <JsonView src={resolvedValue} className="max-w-lg" />
      ) : activeTab === "typescript" ? (
        isGeneratingType ? (
        <div className="text-[0.9rem] text-[#6f655d]">Generating type...</div>
        ) : typeError ? (
        <div className="rounded-lg border border-[#fecaca] bg-[#fee2e2] px-[0.45rem] py-[0.35rem] text-[0.9rem] text-[#b91c1c]">
          {typeError}
        </div>
        ) : (
        <pre className="max-h-[55vh] overflow-auto rounded-lg border border-[#efe7dc] bg-[#fffdf9] p-[0.6rem] text-[0.83rem] leading-[1.4] text-[#2f2a25]">
          {typeText}
        </pre>
        )
      ) : schemaStatus === "loading" ? (
        <div className="text-[0.9rem] text-[#6f655d]">Generating schema...</div>
      ) : schemaError ? (
        <div className="rounded-lg border border-[#fecaca] bg-[#fee2e2] px-[0.45rem] py-[0.35rem] text-[0.9rem] text-[#b91c1c]">
          {schemaError}
        </div>
      ) : (
        <pre className="max-h-[55vh] overflow-auto rounded-lg border border-[#efe7dc] bg-[#fffdf9] p-[0.6rem] text-[0.83rem] leading-[1.4] text-[#2f2a25]">
          {schemaText}
        </pre>
      )}
    </div>
  );
};

export default JsonEditor;
