import { useState, type CSSProperties } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "../lib/utils";

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

export interface BlockNodeData {
  blockId: string;
  isSelected: boolean;
  isExpanded: boolean;
  hasLinkedChildren: boolean;
  title: string;
  summary: string;
  blockKind: "object" | "array" | "other";
  attributes: Array<{
    key: string;
    valueText: string;
    isLinked: boolean;
    targetTitle?: string;
  }>;
  arrayValues: Array<{
    index: number;
    valueText: string;
    isLinked: boolean;
    targetTitle?: string;
  }>;
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
  onToggleExpand: (blockId: string) => void;
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
              nodeData.onToggleExpand(nodeData.blockId);
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
        <div className="mb-[0.3rem] rounded-lg border border-[#e9dfd1] bg-white">
          {nodeData.arrayValues.map((item) => {
            const sourceAttrKey = String(item.index);
            const attrId = `array:${sourceAttrKey}`;
            return (
              <div
                key={`${nodeData.blockId}-array-${item.index}`}
                className={cn(
                  "nodrag nopan relative flex min-w-0 items-center gap-[0.2rem] border-b border-[#f1ebe1] px-[0.35rem] py-[0.2rem] pr-[0.95rem] font-mono text-[0.75rem] last:border-b-0",
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
                <span
                  className={cn(
                    "nodrag nopan inline-flex h-4 w-4 cursor-grab items-center justify-center rounded-full bg-[rgba(37,99,235,0.12)] text-[#2563eb]",
                    !item.isLinked &&
                      "bg-[rgba(138,127,118,0.15)] text-[#8a7f76]",
                  )}
                  title={
                    item.isLinked
                      ? `Linked to ${item.targetTitle ?? "target"} (drag to relink, click to unlink)`
                      : "Drag to another block to create link"
                  }
                  role="button"
                  aria-label={
                    item.isLinked
                      ? `Linked array item ${item.index}. Click to unlink or drag to relink.`
                      : `Drag to link array item ${item.index} to another block.`
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
                    nodeData.onStartAttrDrag(
                      "link",
                      nodeData.blockId,
                      sourceAttrKey,
                    );
                    event.dataTransfer.effectAllowed = "move";
                    const payload = toDragPayload(
                      "link",
                      nodeData.blockId,
                      sourceAttrKey,
                    );
                    event.dataTransfer.setData(ATTR_LINK_MIME, payload);
                    event.dataTransfer.setData("text/plain", payload);
                  }}
                  onDragEnd={() => {
                    nodeData.onEndAttrDrag();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (item.isLinked) {
                      nodeData.onRemoveAttrLink(
                        nodeData.blockId,
                        sourceAttrKey,
                      );
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
                <span
                  className="min-w-0 flex-1 whitespace-normal"
                  style={twoLineClampStyle}
                >
                  {item.valueText}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={getAttrHandleId(sourceAttrKey)}
                  className="pointer-events-none !right-[-8px] !top-1/2 !h-[10px] !w-[10px] !translate-x-1/2 !-translate-y-1/2 !border-2 !border-[#2563eb] !bg-white"
                />
              </div>
            );
          })}
        </div>
      ) : null}

      {nodeData.blockKind === "object" && nodeData.attributes.length > 0 ? (
        <div className="mb-[0.3rem] rounded-lg border border-[#e9dfd1] bg-white">
          {nodeData.attributes.map((attr) => {
            const attrId = `object:${attr.key}`;
            const isEditing = editingAttr?.key === attr.key;
            return (
              <div
                key={attr.key}
                className={cn(
                  "nodrag nopan relative flex min-w-0 items-center gap-[0.2rem] border-b border-[#f1ebe1] px-[0.35rem] py-[0.2rem] pr-[0.95rem] font-mono text-[0.75rem] last:border-b-0",
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
                    className="min-w-0 flex-1 cursor-pointer whitespace-normal rounded-[2px] hover:bg-[#f4f8ff]"
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
                <span
                  className={cn(
                    "nodrag nopan ml-auto inline-flex h-4 w-4 shrink-0 cursor-grab items-center justify-center rounded-full bg-[rgba(37,99,235,0.12)] text-[#2563eb]",
                    !attr.isLinked &&
                      "bg-[rgba(138,127,118,0.15)] text-[#8a7f76]",
                  )}
                  title={
                    attr.isLinked
                      ? `Linked to ${attr.targetTitle ?? "target"} (drag to relink, click to unlink)`
                      : "Drag to another block to create link"
                  }
                  role="button"
                  aria-label={
                    attr.isLinked
                      ? `Linked value ${attr.key}. Click to unlink or drag to relink.`
                      : `Drag to link value ${attr.key} to another block.`
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
                    nodeData.onStartAttrDrag(
                      "link",
                      nodeData.blockId,
                      attr.key,
                    );
                    event.dataTransfer.effectAllowed = "move";
                    const payload = toDragPayload(
                      "link",
                      nodeData.blockId,
                      attr.key,
                    );
                    event.dataTransfer.setData(ATTR_LINK_MIME, payload);
                    event.dataTransfer.setData("text/plain", payload);
                  }}
                  onDragEnd={() => {
                    nodeData.onEndAttrDrag();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (attr.isLinked) {
                      nodeData.onRemoveAttrLink(nodeData.blockId, attr.key);
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
                <Handle
                  type="source"
                  position={Position.Right}
                  id={getAttrHandleId(attr.key)}
                  className="pointer-events-none !right-[-8px] !top-1/2 !h-[10px] !w-[10px] !translate-x-1/2 !-translate-y-1/2 !border-2 !border-[#2563eb] !bg-white"
                />
              </div>
            );
          })}
        </div>
      ) : null}

      {error ? (
        <div className="mb-[0.55rem] rounded-lg border border-[#fecaca] bg-[#fee2e2] px-[0.45rem] py-[0.35rem] text-[0.9rem] text-[#b91c1c]">
          {error}
        </div>
      ) : null}
      <Handle
        type="source"
        position={Position.Right}
        id="block-source"
        className="pointer-events-none !right-[-7px] !h-[10px] !w-[10px] !border-2 !border-[#2563eb] !bg-white"
      />
    </div>
  );
};

export default BlockNode;
