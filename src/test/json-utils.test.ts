import { describe, expect, it } from 'vitest';
import {
  addObjectKey,
  appendArrayItem,
  deleteByPath,
  formatJson,
  parseJsonText,
  renameObjectKey,
  setByPath,
} from '../utils/json';

describe('json utils', () => {
  it('parses valid json and formats it', () => {
    const parsed = parseJsonText('{"a":1}');
    expect(parsed.value).toEqual({ a: 1 });
    expect(formatJson(parsed.value!)).toContain('"a": 1');
  });

  it('returns parse error for invalid json', () => {
    const parsed = parseJsonText('{"a":}');
    expect(parsed.error?.message).toBeTruthy();
  });

  it('supports object and array tree ops', () => {
    const root = { a: { b: 1 }, c: [1] };
    const updated = setByPath(root, ['a', 'b'], 2);
    expect(updated).toEqual({ a: { b: 2 }, c: [1] });

    const added = addObjectKey(updated, ['a'], 'd', true);
    expect(added.value).toEqual({ a: { b: 2, d: true }, c: [1] });

    const appended = appendArrayItem(added.value!, ['c'], 2);
    expect(appended.value).toEqual({ a: { b: 2, d: true }, c: [1, 2] });

    const removed = deleteByPath(appended.value!, ['c', '0']);
    expect(removed).toEqual({ a: { b: 2, d: true }, c: [2] });
  });

  it('prevents key collisions on rename', () => {
    const root = { a: { one: 1, two: 2 } };
    const result = renameObjectKey(root, ['a'], 'one', 'two');
    expect(result.error).toContain('already exists');
  });
});
