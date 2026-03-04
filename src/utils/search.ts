import type { JsonValue } from '../types/model';

type JsonPathSegment = string | number;

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

  while (index < input.length) {
    const char = input[index];

    if (char === '.') {
      index += 1;
      const start = index;
      while (index < input.length && input[index] !== '.' && input[index] !== '[') {
        index += 1;
      }
      if (start === index) return null;
      segments.push(input.slice(start, index));
      continue;
    }

    if (char === '[') {
      index += 1;
      if (index >= input.length) return null;

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
        segments.push(key);
        continue;
      }

      const start = index;
      while (index < input.length && /[0-9]/.test(input[index])) {
        index += 1;
      }
      if (start === index || input[index] !== ']') return null;
      segments.push(Number(input.slice(start, index)));
      index += 1;
      continue;
    }

    return null;
  }

  return segments;
};

export const findByJsonPath = (data: JsonValue, path: string): JsonValue | undefined => {
  const segments = parseJsonPath(path);
  if (!segments) return undefined;

  let current: JsonValue | undefined = data;
  for (const segment of segments) {
    if (typeof segment === 'number') {
      if (!Array.isArray(current)) return undefined;
      current = current[segment];
      if (current === undefined) return undefined;
      continue;
    }

    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined;
    if (!Object.prototype.hasOwnProperty.call(current, segment)) return undefined;
    current = (current as Record<string, JsonValue>)[segment];
  }

  return current;
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
    const found = findByJsonPath(data, jsonPathQuery.path);
    if (found === undefined) return false;
    if (!jsonPathQuery.expectedValue) return true;
    return jsonValueToSearchText(found).includes(jsonPathQuery.expectedValue.toLowerCase());
  }

  return flattenSearchText(title, data).includes(query.toLowerCase());
};
