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
import { getCommentsBefore, type CommentInfo } from '../utils/jsonc';

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

const treeInputClass =
  'w-full rounded-[10px] border border-[#d0c4b5] bg-[#fffefb] px-[0.6rem] py-[0.48rem] text-[#2e2a26] focus:outline-none focus:ring-2 focus:ring-[#f3bc82] focus:ring-offset-1';
const treeButtonClass =
  'inline-flex items-center justify-center rounded-[10px] border border-transparent bg-[#24221f] px-[0.85rem] py-[0.45rem] font-semibold text-[#f8f2eb] transition-colors hover:bg-[#171614]';
const treeDangerButtonClass =
  'inline-flex items-center justify-center rounded-[10px] border border-transparent bg-[#be123c] px-[0.7rem] py-[0.35rem] text-[0.85rem] font-semibold text-white transition-colors hover:bg-[#9f1239]';

const CommentRow = ({ comments }: { comments: CommentInfo[] }) => {
  if (comments.length === 0) return null;

  return (
    <div className="flex flex-col gap-[0.15rem] py-[0.2rem]">
      {comments.map((comment, index) => (
        <div
          key={index}
          className="flex items-start gap-[0.3rem] text-[0.85rem] italic text-[#8a7f75]"
        >
          <span className="select-none opacity-60">
            {comment.type === 'line' ? '//' : '/*'}
          </span>
          <span>{comment.text}</span>
          <span className="select-none opacity-60">
            {comment.type === 'block' ? '*/' : null}
          </span>
        </div>
      ))}
    </div>
  );
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
      <div className="border-l border-[#e9dece] pl-[0.55rem]">
        <div className="flex items-center gap-[0.4rem]">
          <span className="font-medium">{label}</span>
          <span className="text-[0.8rem] text-[#7f756d]">object</span>
          {allowDelete ? (
            <button className={treeDangerButtonClass} onClick={() => onDelete(path)}>
              Delete
            </button>
          ) : null}
        </div>

        <div className="mt-[0.4rem] grid gap-[0.35rem]">
          {Object.entries(value).map(([key, child]) => {
            const comments = getCommentsBefore(value, key);
            return (
              <div key={key} className="grid gap-[0.35rem]">
                {comments.length > 0 ? <CommentRow comments={comments} /> : null}
                <input
                  className={treeInputClass}
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
            );
          })}

          <div className="grid grid-cols-[1fr_1fr_auto] gap-[0.35rem]">
            <input
              className={treeInputClass}
              placeholder="new key"
              value={newKey}
              onChange={(event) => setNewKey(event.target.value)}
            />
            <input
              className={treeInputClass}
              placeholder="value (JSON or text)"
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
            />
            <button
              className={treeButtonClass}
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
      <div className="border-l border-[#e9dece] pl-[0.55rem]">
        <div className="flex items-center gap-[0.4rem]">
          <span className="font-medium">{label}</span>
          <span className="text-[0.8rem] text-[#7f756d]">array[{value.length}]</span>
          {allowDelete ? (
            <button className={treeDangerButtonClass} onClick={() => onDelete(path)}>
              Delete
            </button>
          ) : null}
        </div>

        <div className="mt-[0.4rem] grid gap-[0.35rem]">
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

          <div className="grid grid-cols-[1fr_auto] gap-[0.35rem]">
            <input
              className={treeInputClass}
              placeholder="value (JSON or text)"
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
            />
            <button
              className={treeButtonClass}
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
    <div className="flex items-center gap-[0.4rem]">
      <label className="font-medium">{label}</label>
      <input
        className={treeInputClass}
        value={value === null ? 'null' : String(value)}
        onChange={(event) => onPrimitiveChange(path, event.target.value)}
      />
      {allowDelete ? (
        <button className={treeDangerButtonClass} onClick={() => onDelete(path)}>
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
    <div className="grid gap-[0.45rem]">
      {error ? (
        <div className="mb-[0.55rem] rounded-lg border border-[#fecaca] bg-[#fee2e2] px-[0.45rem] py-[0.35rem] text-[0.9rem] text-[#b91c1c]">
          {error}
        </div>
      ) : null}
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
        <summary className="cursor-pointer font-medium">Preview JSON</summary>
        <pre className="mb-[0.7rem] mt-[0.35rem] overflow-auto rounded-lg border border-[#efe7dc] bg-[#fffdf9] p-[0.6rem]">
          {formatJson(value)}
        </pre>
      </details>
    </div>
  );
};

export default TreeEditor;
