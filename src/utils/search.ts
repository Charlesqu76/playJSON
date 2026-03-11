import type { JsonValue } from '../types/model';

type JsonPathSegment =
  | { type: 'key'; value: string }
  | { type: 'index'; value: number }
  | { type: 'wildcard' }
  | { type: 'recursive-key'; value: string }
  | { type: 'recursive-wildcard' };

const collectParts = (value: JsonValue, out: string[]): void => {
  if (value === null) {
    out.push('null');
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectParts(item, out);
    }
    return;
  }

  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      out.push(key);
      collectParts(nested, out);
    }
    return;
  }

  out.push(String(value));
};

export const flattenSearchText = (title: string, data: JsonValue): string => {
  const parts: string[] = [title];
  collectParts(data, parts);
  return parts.join(' ').toLowerCase();
};

const parseJsonPath = (path: string): JsonPathSegment[] | null => {
  const input = path.trim();
  if (!input.startsWith('$')) return null;

  const segments: JsonPathSegment[] = [];
  let index = 1;

  const readKey = (): string | null => {
    const start = index;
    while (index < input.length && input[index] !== '.' && input[index] !== '[') {
      index += 1;
    }
    if (start === index) return null;
    return input.slice(start, index);
  };

  while (index < input.length) {
    const char = input[index];

    if (char === '.') {
      if (input[index + 1] === '.') {
        index += 2;
        if (index >= input.length) return null;

        if (input[index] === '*') {
          segments.push({ type: 'recursive-wildcard' });
          index += 1;
          continue;
        }

        const recursiveKey = readKey();
        if (!recursiveKey) return null;
        segments.push({ type: 'recursive-key', value: recursiveKey });
        continue;
      }

      index += 1;
      if (input[index] === '*') {
        segments.push({ type: 'wildcard' });
        index += 1;
        continue;
      }

      const key = readKey();
      if (!key) return null;
      segments.push({ type: 'key', value: key });
      continue;
    }

    if (char === '[') {
      index += 1;
      if (index >= input.length) return null;

      if (input[index] === '*') {
        index += 1;
        if (input[index] !== ']') return null;
        index += 1;
        segments.push({ type: 'wildcard' });
        continue;
      }

      const quote = input[index];
      if (quote === '"' || quote === "'") {
        index += 1;
        const start = index;
        while (index < input.length && input[index] !== quote) {
          index += 1;
        }
        if (index >= input.length) return null;

        const key = input.slice(start, index);
        index += 1;
        if (input[index] !== ']') return null;
        index += 1;
        segments.push({ type: 'key', value: key });
        continue;
      }

      const numericStart = index;
      while (index < input.length && /[0-9]/.test(input[index])) {
        index += 1;
      }
      if (numericStart !== index && input[index] === ']') {
        const arrayIndex = Number(input.slice(numericStart, index));
        index += 1;
        segments.push({ type: 'index', value: arrayIndex });
        continue;
      }

      index = numericStart;
      while (index < input.length && input[index] !== ']') {
        index += 1;
      }
      if (index >= input.length) return null;

      const key = input.slice(numericStart, index).trim();
      if (!key) return null;
      index += 1;
      segments.push({ type: 'key', value: key });
      continue;
    }

    return null;
  }

  return segments;
};

const getObjectValues = (value: JsonValue): JsonValue[] => {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value;
  return Object.values(value) as JsonValue[];
};

const collectRecursiveByKey = (value: JsonValue, key: string, out: JsonValue[]): void => {
  if (!value || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    for (const item of value) {
      collectRecursiveByKey(item, key, out);
    }
    return;
  }

  const objectValue = value as Record<string, JsonValue>;
  if (Object.prototype.hasOwnProperty.call(objectValue, key)) {
    out.push(objectValue[key]);
  }

  for (const nested of Object.values(objectValue)) {
    collectRecursiveByKey(nested, key, out);
  }
};

const collectRecursiveWildcard = (value: JsonValue, out: JsonValue[]): void => {
  if (!value || typeof value !== 'object') return;

  for (const nested of getObjectValues(value)) {
    out.push(nested);
    collectRecursiveWildcard(nested, out);
  }
};

const findAllByJsonPath = (data: JsonValue, path: string): JsonValue[] => {
  const segments = parseJsonPath(path);
  if (!segments) return [];

  let current: JsonValue[] = [data];

  for (const segment of segments) {
    const next: JsonValue[] = [];

    if (segment.type === 'key') {
      for (const value of current) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
        if (!Object.prototype.hasOwnProperty.call(value, segment.value)) continue;
        next.push((value as Record<string, JsonValue>)[segment.value]);
      }
      current = next;
      continue;
    }

    if (segment.type === 'index') {
      for (const value of current) {
        if (!Array.isArray(value)) continue;
        const indexedValue = value[segment.value];
        if (indexedValue !== undefined) {
          next.push(indexedValue);
        }
      }
      current = next;
      continue;
    }

    if (segment.type === 'wildcard') {
      for (const value of current) {
        next.push(...getObjectValues(value));
      }
      current = next;
      continue;
    }

    if (segment.type === 'recursive-key') {
      for (const value of current) {
        collectRecursiveByKey(value, segment.value, next);
      }
      current = next;
      continue;
    }

    for (const value of current) {
      collectRecursiveWildcard(value, next);
    }
    current = next;
  }

  return current;
};

export const findByJsonPath = (data: JsonValue, path: string): JsonValue | undefined => {
  const matches = findAllByJsonPath(data, path);
  return matches[0];
};

const tryParseJsonPathQuery = (
  query: string,
): { path: string; expectedValue?: string } | null => {
  const trimmed = query.trim();
  if (!trimmed.startsWith('$')) return null;

  const equalsIndex = trimmed.indexOf('=');
  if (equalsIndex < 0) return { path: trimmed };

  return {
    path: trimmed.slice(0, equalsIndex).trim(),
    expectedValue: trimmed.slice(equalsIndex + 1).trim(),
  };
};

const jsonValueToSearchText = (value: JsonValue): string => {
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value).toLowerCase();
  return String(value).toLowerCase();
};

export const matchesSearchQuery = (title: string, data: JsonValue, rawQuery: string): boolean => {
  const query = rawQuery.trim();
  if (!query) return true;

  const jsonPathQuery = tryParseJsonPathQuery(query);
  if (jsonPathQuery) {
    const found = findAllByJsonPath(data, jsonPathQuery.path);
    if (found.length === 0) return false;
    if (!jsonPathQuery.expectedValue) return true;

    const expected = jsonPathQuery.expectedValue.toLowerCase();
    return found.some((value) => jsonValueToSearchText(value).includes(expected));
  }

  return flattenSearchText(title, data).includes(query.toLowerCase());
};
