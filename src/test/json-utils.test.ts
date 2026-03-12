import { describe, expect, it } from 'vitest';
import {
  addObjectKey,
  appendArrayItem,
  convertJsonToJsonSchema,
  convertTypeScriptTypeToJsonSchema,
  convertJsonToTypeScriptType,
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

  it('converts json value to json schema', async () => {
    const result = await convertJsonToJsonSchema({
      id: 1,
      name: 'Alice',
      tags: ['admin'],
      active: true,
    });

    const schema = result.schema as Record<string, unknown>;
    expect(schema.$schema).toBe('http://json-schema.org/draft-06/schema#');
    expect(schema.$ref).toBe('#/definitions/Root');

    const definitions = schema.definitions as Record<string, unknown>;
    const root = definitions.Root as Record<string, unknown>;
    expect(root.type).toBe('object');

    const properties = root.properties as Record<string, unknown>;
    expect(properties).toBeTruthy();

    const idProp = properties.id as Record<string, unknown>;
    expect(idProp.type).toBe('integer');

    const tagsProp = properties.tags as Record<string, unknown>;
    expect(tagsProp.type).toBe('array');
  });

  it('converts json value to typescript type', async () => {
    const result = await convertJsonToTypeScriptType(
      {
        id: 1,
        name: 'Alice',
        active: true,
      },
      'UserBlock',
    );

    expect(result.typeText).toContain('export interface UserBlock');
    expect(result.typeText).toMatch(/id:\s+number;/);
    expect(result.typeText).toMatch(/name:\s+string;/);
    expect(result.typeText).toContain('active: boolean;');
  });

  it('converts typescript type to json schema', async () => {
    const typeText = `
      export interface UserBlock {
        id: number;
        name: string;
        active: boolean;
        tags?: string[];
      }
    `;

    const result = await convertTypeScriptTypeToJsonSchema(typeText, {
      typeName: 'UserBlock',
    });

    const schema = result.schema as Record<string, unknown>;
    expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect(schema.type).toBe('object');

    const properties = schema.properties as Record<string, unknown>;
    expect(properties).toBeTruthy();
    expect((properties.id as Record<string, unknown>).type).toBe('number');
    expect((properties.name as Record<string, unknown>).type).toBe('string');
    expect((properties.active as Record<string, unknown>).type).toBe('boolean');

    const required = schema.required as string[];
    expect(required).toContain('id');
    expect(required).toContain('name');
    expect(required).toContain('active');
    expect(required).not.toContain('tags');
  });
});
