import { useState } from 'react';
import type { JsonValue } from '../types/model';
import {
  addObjectKey,
  appendArrayItem,
  deleteByPath,
  formatJson,
  isObject,
  parseJsonText,
  primitiveFromInput,
  renameObjectKey,
  setByPath,
} from '../utils/json';

interface TreeEditorProps {
  value: JsonValue;
  onChange: (value: JsonValue) => void;
}

interface TreeNodeProps {
  value: JsonValue;
  path: string[];
  label: string;
  onPrimitiveChange: (path: string[], raw: string) => void;
  onDelete: (path: string[]) => void;
  onRename: (parentPath: string[], from: string, to: string) => void;
  onAddObjectKey: (path: string[], key: string, rawValue: string) => void;
  onAppendArrayItem: (path: string[], rawValue: string) => void;
  allowDelete: boolean;
}

const parseInputToJsonValue = (raw: string): JsonValue => {
  const attempt = parseJsonText(raw);
  if (attempt.value !== undefined) {
    return attempt.value;
  }
  return primitiveFromInput(raw);
};

const TreeNode = ({
  value,
  path,
  label,
  onPrimitiveChange,
  onDelete,
  onRename,
  onAddObjectKey,
  onAppendArrayItem,
  allowDelete,
}: TreeNodeProps) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  if (isObject(value)) {
    return (
      <div className="tree-node">
        <div className="tree-header">
          <span className="tree-label">{label}</span>
          <span className="tree-type">object</span>
          {allowDelete ? (
            <button className="danger" onClick={() => onDelete(path)}>
              Delete
            </button>
          ) : null}
        </div>

        <div className="tree-children">
          {Object.entries(value).map(([key, child]) => (
            <div key={key} className="tree-row">
              <input
                className="tree-key-input"
                value={key}
                onChange={(event) => onRename(path, key, event.target.value)}
              />
              <TreeNode
                value={child}
                path={[...path, key]}
                label={key}
                onPrimitiveChange={onPrimitiveChange}
                onDelete={onDelete}
                onRename={onRename}
                onAddObjectKey={onAddObjectKey}
                onAppendArrayItem={onAppendArrayItem}
                allowDelete
              />
            </div>
          ))}

          <div className="tree-add-row">
            <input
              placeholder="new key"
              value={newKey}
              onChange={(event) => setNewKey(event.target.value)}
            />
            <input
              placeholder="value (JSON or text)"
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
            />
            <button
              onClick={() => {
                onAddObjectKey(path, newKey, newValue);
                setNewKey('');
                setNewValue('');
              }}
            >
              Add Attr
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="tree-node">
        <div className="tree-header">
          <span className="tree-label">{label}</span>
          <span className="tree-type">array[{value.length}]</span>
          {allowDelete ? (
            <button className="danger" onClick={() => onDelete(path)}>
              Delete
            </button>
          ) : null}
        </div>

        <div className="tree-children">
          {value.map((child, index) => (
            <TreeNode
              key={`${path.join('.')}-${index}`}
              value={child}
              path={[...path, String(index)]}
              label={`[${index}]`}
              onPrimitiveChange={onPrimitiveChange}
              onDelete={onDelete}
              onRename={onRename}
              onAddObjectKey={onAddObjectKey}
              onAppendArrayItem={onAppendArrayItem}
              allowDelete
            />
          ))}

          <div className="tree-add-row">
            <input
              placeholder="value (JSON or text)"
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
            />
            <button
              onClick={() => {
                onAppendArrayItem(path, newValue);
                setNewValue('');
              }}
            >
              Add Item
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tree-node primitive">
      <label className="tree-label">{label}</label>
      <input
        value={value === null ? 'null' : String(value)}
        onChange={(event) => onPrimitiveChange(path, event.target.value)}
      />
      {allowDelete ? (
        <button className="danger" onClick={() => onDelete(path)}>
          Delete
        </button>
      ) : null}
    </div>
  );
};

const TreeEditor = ({ value, onChange }: TreeEditorProps) => {
  const [error, setError] = useState<string | null>(null);

  const onPrimitiveChange = (path: string[], raw: string) => {
    setError(null);
    onChange(setByPath(value, path, primitiveFromInput(raw)));
  };

  const onDelete = (path: string[]) => {
    setError(null);
    onChange(deleteByPath(value, path));
  };

  const onRename = (parentPath: string[], from: string, to: string) => {
    if (!to.trim()) {
      setError('Key cannot be empty.');
      return;
    }
    const next = renameObjectKey(value, parentPath, from, to);
    if (next.error) {
      setError(next.error);
      return;
    }
    setError(null);
    if (next.value !== undefined) {
      onChange(next.value);
    }
  };

  const onAddObjectKey = (path: string[], key: string, rawValue: string) => {
    if (!key.trim()) {
      setError('Key cannot be empty.');
      return;
    }

    const next = addObjectKey(value, path, key, parseInputToJsonValue(rawValue));
    if (next.error) {
      setError(next.error);
      return;
    }
    setError(null);
    if (next.value !== undefined) {
      onChange(next.value);
    }
  };

  const onAppendArrayItem = (path: string[], rawValue: string) => {
    const next = appendArrayItem(value, path, parseInputToJsonValue(rawValue));
    if (next.error) {
      setError(next.error);
      return;
    }
    setError(null);
    if (next.value !== undefined) {
      onChange(next.value);
    }
  };

  return (
    <div className="tree-editor">
      {error ? <div className="inline-error">{error}</div> : null}
      <TreeNode
        value={value}
        path={[]}
        label="root"
        onPrimitiveChange={onPrimitiveChange}
        onDelete={onDelete}
        onRename={onRename}
        onAddObjectKey={onAddObjectKey}
        onAppendArrayItem={onAppendArrayItem}
        allowDelete={false}
      />
      <details>
        <summary>Preview JSON</summary>
        <pre className="json-preview">{formatJson(value)}</pre>
      </details>
    </div>
  );
};

export default TreeEditor;
