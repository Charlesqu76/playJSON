import { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

const ATTR_MOVE_MIME = 'application/x-json-attr-move';
const ATTR_LINK_MIME = 'application/x-json-attr-link';

export type AttrDragMode = 'move' | 'link';

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
  blockKind: 'object' | 'array' | 'other';
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
  onStartAttrDrag: (mode: AttrDragMode, sourceBlockId: string, sourceAttrKey: string) => void;
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
    if (typeof parsed.sourceBlockId !== 'string' || typeof parsed.sourceAttrKey !== 'string') {
      return null;
    }
    const mode: AttrDragMode = parsed.mode === 'move' ? 'move' : 'link';
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

const BlockNode = ({ data }: NodeProps) => {
  const nodeData = data as unknown as BlockNodeData;
  const [error, setError] = useState<string | null>(null);
  const [selectedAttrId, setSelectedAttrId] = useState<string | null>(null);
  const [editingAttr, setEditingAttr] = useState<{
    key: string;
    field: 'key' | 'value';
    draft: string;
  } | null>(null);

  return (
    <div
      className={`block-node kind-${nodeData.blockKind} ${nodeData.isSelected ? 'is-selected' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();

        const movePayload = parseAttrDragPayload(event.dataTransfer.getData(ATTR_MOVE_MIME));
        const linkPayload = parseAttrDragPayload(event.dataTransfer.getData(ATTR_LINK_MIME));
        const textPayload = parseAttrDragPayload(event.dataTransfer.getData('text/plain'));
        const payload = movePayload ?? linkPayload ?? nodeData.getActiveAttrDrag() ?? textPayload;

        if (!payload) return;

        if (payload.mode === 'move') {
          nodeData.onMoveAttrToBlock(payload.sourceBlockId, payload.sourceAttrKey, nodeData.blockId);
        } else {
          nodeData.onCreateAttrLink(payload.sourceBlockId, payload.sourceAttrKey, nodeData.blockId);
        }
        nodeData.onEndAttrDrag();
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="block-target"
        className="block-node-target-handle"
      />
      <div className="block-node-head">
        <div className="block-node-title">{nodeData.title}</div>
        {nodeData.hasLinkedChildren ? (
          <button
            className="nodrag nopan block-node-expand-btn"
            onClick={() => {
              nodeData.onToggleExpand(nodeData.blockId);
              setEditingAttr(null);
            }}
          >
            {nodeData.isExpanded ? 'Collapse' : 'Expand'}
          </button>
        ) : null}
      </div>
      <div className="block-node-summary">{nodeData.summary}</div>

      {nodeData.blockKind === 'array' && nodeData.arrayValues.length > 0 ? (
        <div className="block-node-array-values">
          {nodeData.arrayValues.map((item) => {
            const sourceAttrKey = String(item.index);
            const attrId = `array:${sourceAttrKey}`;
            return (
              <div
                key={`${nodeData.blockId}-array-${item.index}`}
                className={`nodrag nopan block-node-array-item ${selectedAttrId === attrId ? 'is-selected' : ''}`}
                draggable
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onMouseDown={(event) => {
                  event.stopPropagation();
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }}
                onClick={() => setSelectedAttrId(attrId)}
                onDragStart={(event) => {
                  event.stopPropagation();
                  setSelectedAttrId(attrId);
                  nodeData.onStartAttrDrag('move', nodeData.blockId, sourceAttrKey);
                  event.dataTransfer.effectAllowed = 'move';
                  const payload = toDragPayload('move', nodeData.blockId, sourceAttrKey);
                  event.dataTransfer.setData(ATTR_MOVE_MIME, payload);
                  event.dataTransfer.setData('text/plain', payload);
                }}
                onDragEnd={() => {
                  nodeData.onEndAttrDrag();
                }}
              >
                <span
                  className={`nodrag nopan attr-link-icon ${item.isLinked ? '' : 'is-idle'}`}
                  title={
                    item.isLinked
                      ? `Linked to ${item.targetTitle ?? 'target'} (drag to relink, click to unlink)`
                      : 'Drag to another block to create link'
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
                    nodeData.onStartAttrDrag('link', nodeData.blockId, sourceAttrKey);
                    event.dataTransfer.effectAllowed = 'move';
                    const payload = toDragPayload('link', nodeData.blockId, sourceAttrKey);
                    event.dataTransfer.setData(ATTR_LINK_MIME, payload);
                    event.dataTransfer.setData('text/plain', payload);
                  }}
                  onDragEnd={() => {
                    nodeData.onEndAttrDrag();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (item.isLinked) {
                      nodeData.onRemoveAttrLink(nodeData.blockId, sourceAttrKey);
                    }
                  }}
                >
                  <svg
                    className="attr-link-glyph"
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
                </span>{' '}
                {item.valueText}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={getAttrHandleId(sourceAttrKey)}
                  className="block-node-attr-handle"
                />
              </div>
            );
          })}
        </div>
      ) : null}

      {nodeData.blockKind === 'object' && nodeData.attributes.length > 0 ? (
        <div className="block-node-attrs">
          {nodeData.attributes.map((attr) => {
            const attrId = `object:${attr.key}`;
            const isEditing = editingAttr?.key === attr.key;
            return (
              <div
                key={attr.key}
                className={`nodrag nopan block-node-attr-item ${selectedAttrId === attrId ? 'is-selected' : ''}`}
                draggable={!isEditing}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onMouseDown={(event) => {
                  event.stopPropagation();
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }}
                onClick={() => setSelectedAttrId(attrId)}
                onDragStart={(event) => {
                  event.stopPropagation();
                  if (isEditing) {
                    event.preventDefault();
                    return;
                  }
                  setSelectedAttrId(attrId);
                  nodeData.onStartAttrDrag('move', nodeData.blockId, attr.key);
                  event.dataTransfer.effectAllowed = 'move';
                  const payload = toDragPayload('move', nodeData.blockId, attr.key);
                  event.dataTransfer.setData(ATTR_MOVE_MIME, payload);
                  event.dataTransfer.setData('text/plain', payload);
                }}
                onDragEnd={() => {
                  nodeData.onEndAttrDrag();
                }}
              >
                <span
                  className="block-node-attr-key"
                  onDoubleClick={() =>
                    setEditingAttr({
                      key: attr.key,
                      field: 'key',
                      draft: attr.key,
                    })
                  }
                >
                  {editingAttr?.key === attr.key && editingAttr.field === 'key' ? (
                    <input
                      className="nodrag nopan block-node-attr-input"
                      value={editingAttr.draft}
                      autoFocus
                      onChange={(event) =>
                        setEditingAttr((prev) =>
                          prev ? { ...prev, draft: event.target.value } : prev,
                        )
                      }
                      onBlur={() => {
                        const draft = editingAttr?.draft ?? attr.key;
                        const result = nodeData.onRenameAttribute(attr.key, draft);
                        if (result) {
                          setError(result);
                          return;
                        }
                        setError(null);
                        setEditingAttr(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          setEditingAttr(null);
                          return;
                        }
                        if (event.key !== 'Enter') return;
                        const draft = editingAttr?.draft ?? attr.key;
                        const result = nodeData.onRenameAttribute(attr.key, draft);
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
                <span>: </span>
                <span
                  className="block-node-attr-value"
                  onDoubleClick={() =>
                    setEditingAttr({
                      key: attr.key,
                      field: 'value',
                      draft: attr.valueText,
                    })
                  }
                >
                  {editingAttr?.key === attr.key && editingAttr.field === 'value' ? (
                    <input
                      className="nodrag nopan block-node-attr-input"
                      value={editingAttr.draft}
                      autoFocus
                      onChange={(event) =>
                        setEditingAttr((prev) =>
                          prev ? { ...prev, draft: event.target.value } : prev,
                        )
                      }
                      onBlur={() => {
                        const draft = editingAttr?.draft ?? attr.valueText;
                        const result = nodeData.onUpdateAttributeValue(attr.key, draft);
                        if (result) {
                          setError(result);
                          return;
                        }
                        setError(null);
                        setEditingAttr(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          setEditingAttr(null);
                          return;
                        }
                        if (event.key !== 'Enter') return;
                        const draft = editingAttr?.draft ?? attr.valueText;
                        const result = nodeData.onUpdateAttributeValue(attr.key, draft);
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
                <span
                  className={`nodrag nopan attr-link-icon block-node-attr-link ${attr.isLinked ? '' : 'is-idle'}`}
                  title={
                    attr.isLinked
                      ? `Linked to ${attr.targetTitle ?? 'target'} (drag to relink, click to unlink)`
                      : 'Drag to another block to create link'
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
                    nodeData.onStartAttrDrag('link', nodeData.blockId, attr.key);
                    event.dataTransfer.effectAllowed = 'move';
                    const payload = toDragPayload('link', nodeData.blockId, attr.key);
                    event.dataTransfer.setData(ATTR_LINK_MIME, payload);
                    event.dataTransfer.setData('text/plain', payload);
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
                    className="attr-link-glyph"
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
                  className="block-node-attr-handle"
                />
              </div>
            );
          })}
        </div>
      ) : null}

      {error ? <div className="inline-error">{error}</div> : null}
      <Handle
        type="source"
        position={Position.Right}
        id="block-source"
        className="block-node-block-source-handle"
      />
    </div>
  );
};

export default BlockNode;
