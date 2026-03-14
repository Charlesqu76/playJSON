import { useState, type CSSProperties, Fragment, memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "../lib/utils";
import type { JsonValue } from "../types/model";

const ATTR_MOVE_MIME = "application/x-json-attr-move";
const ATTR_LINK_MIME = "application/x-json-attr-link";

export type AttrDragMode = "move" | "link";

export interface ActiveAttrDrag {
  mode: AttrDragMode;
  sourceBlockId: string;
  sourceAttrKey: string;
}

export const getAttrHandleId = (sourceAttrKey: string): string =>
  `attr-${encodeURIComponent(sourceAttrKey)}`;

export interface NestedValue {
  key: string;
  valueText: string;
  isExpandable: boolean;
  isExpanded: boolean;
  isLinked: boolean;
  isCollapsed: boolean;
  targetTitle?: string;
  nestedType: "object" | "array" | "primitive";
  childCount?: number;
}

export interface BlockNodeData {
  blockId: string;
  isSelected: boolean;
  isExpanded: boolean;
  hasLinkedChildren: boolean;
  title: string;
  summary: string;
  blockKind: "object" | "array" | "other";
  attributes: NestedValue[];
  arrayValues: NestedValue[];
  expandedPaths: ReadonlySet<string>;
  onRenameAttribute: (oldKey: string, newKey: string) => string | null;
  onUpdateAttributeValue: (key: string, rawValue: string) => string | null;
  onCreateAttrLink: (
    sourceBlockId: string,
    sourceAttrKey: string,
    targetBlockId: string,
  ) => void;
  onMoveAttrToBlock: (
    sourceBlockId: string,
    sourceAttrKey: string,
    targetBlockId: string,
  ) => void;
  onStartAttrDrag: (
    mode: AttrDragMode,
    sourceBlockId: string,
    sourceAttrKey: string,
  ) => void;
  onEndAttrDrag: () => void;
  getActiveAttrDrag: () => ActiveAttrDrag | null;
  onRemoveAttrLink: (sourceBlockId: string, sourceAttrKey: string) => void;
  onToggleBlockExpand: (blockId: string) => void;
  onToggleAttrLinkCollapse: (blockId: string, attrKey: string) => void;
  onToggleNestedExpand: (blockId: string, path: string) => void;
  getNestedValue: (path: string) => JsonValue | undefined;
}

const parseAttrDragPayload = (raw: string): ActiveAttrDrag | null => {
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

const toDragPayload = (
  mode: AttrDragMode,
  sourceBlockId: string,
  sourceAttrKey: string,
): string => JSON.stringify({ mode, sourceBlockId, sourceAttrKey });

const twoLineClampStyle: CSSProperties = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
};

const ExpandToggle = memo(function ExpandToggle({
  isExpanded,
  onClick,
}: {
  isExpanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="nodrag nopan inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm bg-[rgba(139,127,118,0.12)] text-[#6b5d52] hover:bg-[rgba(139,127,118,0.2)]"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={isExpanded ? "Collapse" : "Expand"}
      aria-label={isExpanded ? "Collapse nested value" : "Expand nested value"}
    >
      <svg
        className="h-3 w-3 transition-transform"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
      >
        <path
          d="M6 4L10 8L6 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
});

const CollapseButton = memo(function CollapseButton({
  isCollapsed,
  onClick,
}: {
  isCollapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "nodrag nopan inline-flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#2563eb]",
        isCollapsed
          ? "bg-[rgba(37,99,235,0.25)]"
          : "bg-[rgba(37,99,235,0.12)]"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={isCollapsed ? "Show linked block" : "Hide linked block"}
      aria-label={isCollapsed ? "Show linked block" : "Hide linked block"}
    >
      <svg
        className="h-3 w-3"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {isCollapsed ? (
          <path
            d="M8 3v10M3 8h10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M4 8h8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
});

const LinkButton = memo(function LinkButton({
  isLinked,
  targetTitle,
  onLinkDragStart,
  onLinkDragEnd,
  onUnlink,
}: {
  isLinked: boolean;
  targetTitle?: string;
  onLinkDragStart: () => void;
  onLinkDragEnd: () => void;
  onUnlink: () => void;
}) {
  return (
    <span
      className={cn(
        "nodrag nopan ml-auto inline-flex h-4 w-4 shrink-0 cursor-grab items-center justify-center rounded-full bg-[rgba(37,99,235,0.12)] text-[#2563eb]",
        !isLinked && "bg-[rgba(138,127,118,0.15)] text-[#8a7f76]",
      )}
      title={
        isLinked
          ? `Linked to ${targetTitle ?? "target"} (drag to relink, click to unlink)`
          : "Drag to another block to create link"
      }
      role="button"
      aria-label={
        isLinked
          ? "Linked value. Click to unlink or drag to relink."
          : "Drag to link value to another block."
      }
      draggable
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
      onDragStart={(event) => {
        event.stopPropagation();
        onLinkDragStart();
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        onLinkDragEnd();
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (isLinked) {
          onUnlink();
        }
      }}
    >
      <svg
        className="h-3 w-3"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M10.59 13.41a1 1 0 0 1 0-1.41l2.83-2.83a3 3 0 1 1 4.24 4.24l-1.41 1.41M13.41 10.59a1 1 0 0 1 0 1.41l-2.83 2.83a3 3 0 1 1-4.24-4.24l1.41-1.41"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
});

const toInlineValue = (value: unknown): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.length}]`;
  if (typeof value === "object") return `{${Object.keys(value).length}}`;
  if (typeof value === "string") return `"${value}"`;
  return String(value);
};

const getNestedType = (value: unknown): "object" | "array" | "primitive" => {
  if (Array.isArray(value)) return "array";
  if (value && typeof value === "object") return "object";
  return "primitive";
};

const NestedValueRenderer = memo(function NestedValueRenderer({
  value,
  path,
  depth,
  nodeData,
  selectedAttrId,
  setSelectedAttrId,
  editingAttr,
  setEditingAttr,
  setError,
}: {
  value: JsonValue;
  path: string;
  depth: number;
  nodeData: BlockNodeData;
  selectedAttrId: string | null;
  setSelectedAttrId: (id: string | null) => void;
  editingAttr: { key: string; field: "key" | "value"; draft: string } | null;
  setEditingAttr: (v: { key: string; field: "key" | "value"; draft: string } | null) => void;
  setError: (err: string | null) => void;
}) {
  const isObject = value && typeof value === "object" && !Array.isArray(value);
  const isArray = Array.isArray(value);

  if (!isObject && !isArray) {
    return null;
  }

  const entries: Array<[string, JsonValue]> = isObject
    ? Object.entries(value as Record<string, JsonValue>)
    : (value as JsonValue[]).map((v, i) => [String(i), v] as [string, JsonValue]);

  const paddingLeft = depth * 8;

  return (
    <div
      className="border-t border-[#f1ebe1] bg-[#faf8f5]"
      style={{ paddingLeft }}
    >
      {entries.map(([key, val]) => {
        const childPath = `${path}.${key}`;
        const childExpanded = nodeData.expandedPaths.has(childPath);
        const childType = getNestedType(val);
        const childExpandable = childType !== "primitive";
        const childValueText = toInlineValue(val);
        const childIsObject = val && typeof val === "object" && !Array.isArray(val);
        const childIsArray = Array.isArray(val);

        return (
          <Fragment key={childPath}>
            <div
              className={cn(
                "nodrag nopan relative flex min-w-0 items-center gap-[0.2rem] border-b border-[#f1ebe1] px-[0.35rem] py-[0.15rem] font-mono text-[0.72rem] last:border-b-0",
                selectedAttrId === childPath && "bg-[#edf4ff]",
              )}
              onClick={() => setSelectedAttrId(childPath)}
            >
              <div className="min-w-0 flex flex-1 items-center gap-[0.15rem]">
                {childExpandable && (
                  <ExpandToggle
                    isExpanded={childExpanded}
                    onClick={() => nodeData.onToggleNestedExpand(nodeData.blockId, childPath)}
                  />
                )}
                <span className="min-w-0 shrink whitespace-normal text-[#6b5d52]">
                  {key}
                </span>
                <span className="shrink-0 text-[#9b8d82]">:</span>
                <span
                  className={cn(
                    "min-w-0 flex-1 whitespace-normal",
                    childIsObject && "text-[#b87333]",
                    childIsArray && "text-[#4a90c2]",
                    !childExpandable && "text-[#5a5a5a]",
                  )}
                >
                  {childValueText}
                </span>
              </div>
            </div>
            {childExpandable && childExpanded && (
              <NestedValueRenderer
                value={val}
                path={childPath}
                depth={depth + 1}
                nodeData={nodeData}
                selectedAttrId={selectedAttrId}
                setSelectedAttrId={setSelectedAttrId}
                editingAttr={editingAttr}
                setEditingAttr={setEditingAttr}
                setError={setError}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
});

const BlockNode = ({ data }: NodeProps) => {
  const nodeData = data as unknown as BlockNodeData;
  const [error, setError] = useState<string | null>(null);
  const [selectedAttrId, setSelectedAttrId] = useState<string | null>(null);
  const [editingAttr, setEditingAttr] = useState<{
    key: string;
    field: "key" | "value";
    draft: string;
  } | null>(null);

  return (
    <div
      className={cn(
        "max-w-[320px] min-w-[170px] overflow-hidden rounded-xl border p-2 transition-[box-shadow,border-color,background] duration-100",
        nodeData.blockKind === "object" && "border-[#d7b691] bg-[#fff8ee]",
        nodeData.blockKind === "array" && "border-[#9fc3de] bg-[#edf7ff]",
        nodeData.blockKind === "other" && "border-[#c6c6c6] bg-[#f7f7f7]",
        nodeData.isSelected &&
          "border-[#2563eb] bg-[#f7fbff] shadow-[0_0_0_2px_rgba(37,99,235,0.2)]",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();

        const movePayload = parseAttrDragPayload(
          event.dataTransfer.getData(ATTR_MOVE_MIME),
        );
        const linkPayload = parseAttrDragPayload(
          event.dataTransfer.getData(ATTR_LINK_MIME),
        );
        const textPayload = parseAttrDragPayload(
          event.dataTransfer.getData("text/plain"),
        );
        const payload =
          movePayload ??
          linkPayload ??
          nodeData.getActiveAttrDrag() ??
          textPayload;

        if (!payload) return;

        if (payload.mode === "move") {
          nodeData.onMoveAttrToBlock(
            payload.sourceBlockId,
            payload.sourceAttrKey,
            nodeData.blockId,
          );
        } else {
          nodeData.onCreateAttrLink(
            payload.sourceBlockId,
            payload.sourceAttrKey,
            nodeData.blockId,
          );
        }
        nodeData.onEndAttrDrag();
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="block-target"
        className="pointer-events-none !left-[-7px] !h-[10px] !w-[10px] !border-2 !border-[#2563eb] !bg-white"
      />
      <div className="flex min-w-0 items-center justify-between gap-[0.45rem]">
        <div
          className="min-w-0 flex-1 whitespace-normal font-bold"
          style={twoLineClampStyle}
        >
          {nodeData.title}
        </div>
        {nodeData.hasLinkedChildren ? (
          <button
            className="nodrag nopan shrink-0 rounded-md border border-[#d9d0c4] bg-[#fffefb] px-[0.4rem] py-[0.18rem] text-[0.72rem] hover:bg-[#f3ede3]"
            onClick={() => {
              nodeData.onToggleBlockExpand(nodeData.blockId);
              setEditingAttr(null);
            }}
          >
            {nodeData.isExpanded ? "Collapse" : "Expand"}
          </button>
        ) : null}
      </div>
      <div
        className="mb-[0.45rem] mt-[0.2rem] whitespace-normal text-[0.85rem] text-[#61564f]"
        style={twoLineClampStyle}
      >
        {nodeData.summary}
      </div>

      {nodeData.blockKind === "array" && nodeData.arrayValues.length > 0 ? (
        <div className="mb-[0.3rem] rounded-lg border border-[#e9dfd1] bg-white overflow-hidden">
          {nodeData.arrayValues.map((item) => {
            const sourceAttrKey = item.key;
            const attrId = `array:${sourceAttrKey}`;
            const isExpanded = item.isExpanded;
            const nestedValue = nodeData.getNestedValue(sourceAttrKey);

            return (
              <Fragment key={`${nodeData.blockId}-array-${sourceAttrKey}`}>
                <div
                  className={cn(
                    "nodrag nopan relative flex min-w-0 items-center gap-[0.2rem] border-b border-[#f1ebe1] px-[0.35rem] py-[0.2rem] font-mono text-[0.75rem]",
                    selectedAttrId === attrId && "bg-[#edf4ff]",
                  )}
                  draggable
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  onMouseDown={(event) => {
                    event.stopPropagation();
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onClick={() => setSelectedAttrId(attrId)}
                  onDragStart={(event) => {
                    event.stopPropagation();
                    setSelectedAttrId(attrId);
                    nodeData.onStartAttrDrag(
                      "move",
                      nodeData.blockId,
                      sourceAttrKey,
                    );
                    event.dataTransfer.effectAllowed = "move";
                    const payload = toDragPayload(
                      "move",
                      nodeData.blockId,
                      sourceAttrKey,
                    );
                    event.dataTransfer.setData(ATTR_MOVE_MIME, payload);
                    event.dataTransfer.setData("text/plain", payload);
                  }}
                  onDragEnd={() => {
                    nodeData.onEndAttrDrag();
                  }}
                >
                  {item.isExpandable && (
                    <ExpandToggle
                      isExpanded={isExpanded}
                      onClick={() => nodeData.onToggleNestedExpand(nodeData.blockId, sourceAttrKey)}
                    />
                  )}
                  <span
                    className="min-w-0 flex-1 whitespace-normal"
                    style={twoLineClampStyle}
                  >
                    {item.valueText}
                  </span>
                  {item.isLinked && (
                    <CollapseButton
                      isCollapsed={item.isCollapsed}
                      onClick={() => nodeData.onToggleAttrLinkCollapse(nodeData.blockId, sourceAttrKey)}
                    />
                  )}
                  <LinkButton
                    isLinked={item.isLinked}
                    targetTitle={item.targetTitle}
                    onLinkDragStart={() => {
                      nodeData.onStartAttrDrag("link", nodeData.blockId, sourceAttrKey);
                    }}
                    onLinkDragEnd={() => nodeData.onEndAttrDrag()}
                    onUnlink={() => nodeData.onRemoveAttrLink(nodeData.blockId, sourceAttrKey)}
                  />
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={getAttrHandleId(sourceAttrKey)}
                    className="pointer-events-none h-2.5! w-2.5! border-2! border-[#2563eb]! bg-white!"
                  />
                </div>
                {item.isExpandable && isExpanded && nestedValue && (
                  <NestedValueRenderer
                    value={nestedValue}
                    path={sourceAttrKey}
                    depth={1}
                    nodeData={nodeData}
                    selectedAttrId={selectedAttrId}
                    setSelectedAttrId={setSelectedAttrId}
                    editingAttr={editingAttr}
                    setEditingAttr={setEditingAttr}
                    setError={setError}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      ) : null}

      {nodeData.blockKind === "object" && nodeData.attributes.length > 0 ? (
        <div className="mb-[0.3rem] rounded-lg border border-[#e9dfd1] bg-white overflow-hidden">
          {nodeData.attributes.map((attr) => {
            const attrId = `object:${attr.key}`;
            const isEditing = editingAttr?.key === attr.key;
            const isExpanded = attr.isExpanded;
            const nestedValue = nodeData.getNestedValue(attr.key);

            return (
              <Fragment key={attr.key}>
                <div
                  className={cn(
                    "nodrag nopan relative flex min-w-0 items-center gap-[0.2rem] border-b border-[#f1ebe1] px-[0.35rem] py-[0.2rem] font-mono text-[0.75rem]",
                    selectedAttrId === attrId && "bg-[#edf4ff]",
                  )}
                  draggable={!isEditing}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  onMouseDown={(event) => {
                    event.stopPropagation();
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onClick={() => setSelectedAttrId(attrId)}
                  onDragStart={(event) => {
                    event.stopPropagation();
                    if (isEditing) {
                      event.preventDefault();
                      return;
                    }
                    setSelectedAttrId(attrId);
                    nodeData.onStartAttrDrag("move", nodeData.blockId, attr.key);
                    event.dataTransfer.effectAllowed = "move";
                    const payload = toDragPayload(
                      "move",
                      nodeData.blockId,
                      attr.key,
                    );
                    event.dataTransfer.setData(ATTR_MOVE_MIME, payload);
                    event.dataTransfer.setData("text/plain", payload);
                  }}
                  onDragEnd={() => {
                    nodeData.onEndAttrDrag();
                  }}
                >
                  <div className="min-w-0 flex flex-1 items-center gap-[0.15rem]">
                    {attr.isExpandable && (
                      <ExpandToggle
                        isExpanded={isExpanded}
                        onClick={() => nodeData.onToggleNestedExpand(nodeData.blockId, attr.key)}
                      />
                    )}
                    <span
                      className="min-w-0 max-w-[45%] shrink cursor-pointer whitespace-normal rounded-[2px] hover:bg-[#f4f8ff]"
                      style={twoLineClampStyle}
                      onDoubleClick={() =>
                        setEditingAttr({
                          key: attr.key,
                          field: "key",
                          draft: attr.key,
                        })
                      }
                    >
                      {editingAttr?.key === attr.key &&
                      editingAttr.field === "key" ? (
                        <input
                          className="nodrag nopan w-[120px] rounded border border-[#d0c4b5] px-[0.2rem] py-[0.1rem] text-[0.72rem] focus:outline-none focus:ring-1 focus:ring-[#f3bc82]"
                          value={editingAttr.draft}
                          autoFocus
                          onChange={(event) =>
                            setEditingAttr((prev) =>
                              prev
                                ? { ...prev, draft: event.target.value }
                                : prev,
                            )
                          }
                          onBlur={() => {
                            const draft = editingAttr?.draft ?? attr.key;
                            const result = nodeData.onRenameAttribute(
                              attr.key,
                              draft,
                            );
                            if (result) {
                              setError(result);
                              return;
                            }
                            setError(null);
                            setEditingAttr(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              setEditingAttr(null);
                              return;
                            }
                            if (event.key !== "Enter") return;
                            const draft = editingAttr?.draft ?? attr.key;
                            const result = nodeData.onRenameAttribute(
                              attr.key,
                              draft,
                            );
                            if (result) {
                              setError(result);
                              return;
                            }
                            setError(null);
                            setEditingAttr(null);
                          }}
                        />
                      ) : (
                        attr.key
                      )}
                    </span>
                    <span className="shrink-0">: </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 cursor-pointer whitespace-normal rounded-[2px] hover:bg-[#f4f8ff]",
                        attr.nestedType === "object" && "text-[#b87333]",
                        attr.nestedType === "array" && "text-[#4a90c2]",
                      )}
                      style={twoLineClampStyle}
                      onDoubleClick={() =>
                        setEditingAttr({
                          key: attr.key,
                          field: "value",
                          draft: attr.valueText,
                        })
                      }
                    >
                      {editingAttr?.key === attr.key &&
                      editingAttr.field === "value" ? (
                        <input
                          className="nodrag nopan w-[120px] rounded border border-[#d0c4b5] px-[0.2rem] py-[0.1rem] text-[0.72rem] focus:outline-none focus:ring-1 focus:ring-[#f3bc82]"
                          value={editingAttr.draft}
                          autoFocus
                          onChange={(event) =>
                            setEditingAttr((prev) =>
                              prev
                                ? { ...prev, draft: event.target.value }
                                : prev,
                            )
                          }
                          onBlur={() => {
                            const draft = editingAttr?.draft ?? attr.valueText;
                            const result = nodeData.onUpdateAttributeValue(
                              attr.key,
                              draft,
                            );
                            if (result) {
                              setError(result);
                              return;
                            }
                            setError(null);
                            setEditingAttr(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              setEditingAttr(null);
                              return;
                            }
                            if (event.key !== "Enter") return;
                            const draft = editingAttr?.draft ?? attr.valueText;
                            const result = nodeData.onUpdateAttributeValue(
                              attr.key,
                              draft,
                            );
                            if (result) {
                              setError(result);
                              return;
                            }
                            setError(null);
                            setEditingAttr(null);
                          }}
                        />
                      ) : (
                        attr.valueText
                      )}
                    </span>
                  </div>
                  {attr.isLinked && (
                    <CollapseButton
                      isCollapsed={attr.isCollapsed}
                      onClick={() => nodeData.onToggleAttrLinkCollapse(nodeData.blockId, attr.key)}
                    />
                  )}
                  <LinkButton
                    isLinked={attr.isLinked}
                    targetTitle={attr.targetTitle}
                    onLinkDragStart={() => {
                      nodeData.onStartAttrDrag("link", nodeData.blockId, attr.key);
                    }}
                    onLinkDragEnd={() => nodeData.onEndAttrDrag()}
                    onUnlink={() => nodeData.onRemoveAttrLink(nodeData.blockId, attr.key)}
                  />
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={getAttrHandleId(attr.key)}
                    className="pointer-events-none !h-[10px] !w-[10px] !border-2 !border-[#2563eb] !bg-white"
                  />
                </div>
                {attr.isExpandable && isExpanded && nestedValue && (
                  <NestedValueRenderer
                    value={nestedValue}
                    path={attr.key}
                    depth={1}
                    nodeData={nodeData}
                    selectedAttrId={selectedAttrId}
                    setSelectedAttrId={setSelectedAttrId}
                    editingAttr={editingAttr}
                    setEditingAttr={setEditingAttr}
                    setError={setError}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      ) : null}

      {error ? (
        <div className="mb-[0.55rem] rounded-lg border border-[#fecaca] bg-[#fee2e2] px-[0.45rem] py-[0.35rem] text-[0.9rem] text-[#b91c1c]">
          {error}
        </div>
      ) : null}
    </div>
  );
};

export default BlockNode;