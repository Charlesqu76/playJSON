import { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

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
  onRemoveAttrLink: (sourceBlockId: string, sourceAttrKey: string) => void;
  onToggleExpand: (blockId: string) => void;
}

const BlockNode = ({ data }: NodeProps) => {
  const nodeData = data as unknown as BlockNodeData;
  const [error, setError] = useState<string | null>(null);
  const [editingAttr, setEditingAttr] = useState<{
    key: string;
    field: 'key' | 'value';
    draft: string;
  } | null>(null);

  return (
    <div
      className={`block-node ${nodeData.isSelected ? 'is-selected' : ''}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData('application/x-json-attr-link');
        if (!raw) return;
        try {
          const payload = JSON.parse(raw) as { sourceBlockId: string; sourceAttrKey: string };
          nodeData.onCreateAttrLink(payload.sourceBlockId, payload.sourceAttrKey, nodeData.blockId);
        } catch {
          // no-op for invalid payload
        }
      }}
    >
      <Handle type="target" position={Position.Left} />
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
          {nodeData.arrayValues.map((item) => (
            <div key={`${nodeData.blockId}-array-${item.index}`} className="block-node-array-item">
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
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData(
                    'application/x-json-attr-link',
                    JSON.stringify({
                      sourceBlockId: nodeData.blockId,
                      sourceAttrKey: String(item.index),
                    }),
                  );
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (item.isLinked) {
                    nodeData.onRemoveAttrLink(nodeData.blockId, String(item.index));
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
            </div>
          ))}
        </div>
      ) : null}
      {nodeData.blockKind === 'object' && nodeData.attributes.length > 0 ? (
        <div className="block-node-attrs">
          {nodeData.attributes.map((attr) => (
            <div key={attr.key} className="block-node-attr-item">
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
                  <>
                    <span
                      className={`nodrag nopan attr-link-icon ${attr.isLinked ? '' : 'is-idle'}`}
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
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData(
                          'application/x-json-attr-link',
                          JSON.stringify({
                            sourceBlockId: nodeData.blockId,
                            sourceAttrKey: attr.key,
                          }),
                        );
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
                    </span>{' '}
                    {attr.valueText}
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {error ? <div className="inline-error">{error}</div> : null}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default BlockNode;
