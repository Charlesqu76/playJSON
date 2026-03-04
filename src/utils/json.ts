import { jsonValueSchema, type JsonArray, type JsonObject, type JsonValue } from '../types/model';

export interface JsonParseError {
  message: string;
}

export const parseJsonText = (text: string): { value?: JsonValue; error?: JsonParseError } => {
  try {
    const parsed = JSON.parse(text) as unknown;
    const checked = jsonValueSchema.safeParse(parsed);
    if (!checked.success) {
      return { error: { message: checked.error.issues[0]?.message ?? 'Invalid JSON value.' } };
    }
    return { value: checked.data };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to parse JSON.',
      },
    };
  }
};

export const formatJson = (value: JsonValue): string => JSON.stringify(value, null, 2);

export const summarizeJson = (value: JsonValue): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === 'object') return `Object(${Object.keys(value).length})`;
  return String(value);
};

export const isObject = (value: JsonValue): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isArray = (value: JsonValue): value is JsonArray => Array.isArray(value);

export const primitiveFromInput = (raw: string): JsonValue => {
  const trimmed = raw.trim();
  if (trimmed === 'null') return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed.length > 0 && !Number.isNaN(Number(trimmed))) return Number(trimmed);
  return raw;
};

export const findByPath = (root: JsonValue, path: string[]): JsonValue => {
  let current: JsonValue = root;
  for (const segment of path) {
    if (Array.isArray(current)) {
      current = current[Number(segment)] as JsonValue;
    } else if (isObject(current)) {
      current = current[segment] as JsonValue;
    }
  }
  return current;
};

export const setByPath = (root: JsonValue, path: string[], nextValue: JsonValue): JsonValue => {
  if (path.length === 0) return nextValue;

  const [head, ...tail] = path;
  if (Array.isArray(root)) {
    const idx = Number(head);
    const copy = [...root];
    copy[idx] = setByPath(copy[idx] as JsonValue, tail, nextValue);
    return copy;
  }

  if (isObject(root)) {
    const copy: JsonObject = { ...root };
    copy[head] = setByPath(copy[head] as JsonValue, tail, nextValue);
    return copy;
  }

  return root;
};

export const deleteByPath = (root: JsonValue, path: string[]): JsonValue => {
  if (path.length === 0) return root;

  if (path.length === 1) {
    const [last] = path;
    if (Array.isArray(root)) {
      const idx = Number(last);
      return root.filter((_, i) => i !== idx);
    }
    if (isObject(root)) {
      const copy: JsonObject = { ...root };
      delete copy[last];
      return copy;
    }
    return root;
  }

  const parentPath = path.slice(0, -1);
  const last = path[path.length - 1] as string;
  const parent = findByPath(root, parentPath);

  let updatedParent: JsonValue = parent;
  if (Array.isArray(parent)) {
    const idx = Number(last);
    updatedParent = parent.filter((_, i) => i !== idx);
  } else if (isObject(parent)) {
    const copy: JsonObject = { ...parent };
    delete copy[last];
    updatedParent = copy;
  }

  return setByPath(root, parentPath, updatedParent);
};

export const renameObjectKey = (
  root: JsonValue,
  pathToObject: string[],
  fromKey: string,
  toKey: string,
): { value?: JsonValue; error?: string } => {
  const parent = findByPath(root, pathToObject);
  if (!isObject(parent)) {
    return { error: 'Parent is not an object.' };
  }

  if (fromKey === toKey) {
    return { value: root };
  }

  if (toKey in parent) {
    return { error: `Key "${toKey}" already exists.` };
  }

  const updated: JsonObject = {};
  for (const [key, value] of Object.entries(parent)) {
    updated[key === fromKey ? toKey : key] = value;
  }

  return { value: setByPath(root, pathToObject, updated) };
};

export const addObjectKey = (
  root: JsonValue,
  pathToObject: string[],
  key: string,
  value: JsonValue,
): { value?: JsonValue; error?: string } => {
  const parent = findByPath(root, pathToObject);
  if (!isObject(parent)) {
    return { error: 'Parent is not an object.' };
  }
  if (key in parent) {
    return { error: `Key "${key}" already exists.` };
  }
  const updated: JsonObject = { ...parent, [key]: value };
  return { value: setByPath(root, pathToObject, updated) };
};

export const appendArrayItem = (
  root: JsonValue,
  pathToArray: string[],
  value: JsonValue,
): { value?: JsonValue; error?: string } => {
  const parent = findByPath(root, pathToArray);
  if (!Array.isArray(parent)) {
    return { error: 'Parent is not an array.' };
  }

  return { value: setByPath(root, pathToArray, [...parent, value]) };
};
