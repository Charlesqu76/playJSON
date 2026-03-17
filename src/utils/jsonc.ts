import { parse, stringify, assign } from 'comment-json';
import type { JsonValue } from '../types/model';

export interface JsoncParseResult {
  value?: JsonValue;
  error?: { message: string };
}

export interface CommentInfo {
  text: string;
  type: 'line' | 'block';
}

/**
 * Parse JSON with comments (JSONC format).
 * Supports // single-line and /* block * / comments.
 * Comments are preserved and can be stringified back.
 */
export const parseJsonc = (text: string): JsoncParseResult => {
  try {
    const parsed = parse(text) as unknown;
    return { value: parsed as JsonValue };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'Failed to parse JSON with comments.',
      },
    };
  }
};

/**
 * Stringify JSON with comments preserved.
 * Uses comment-json's stringify to maintain comment positions.
 */
export const stringifyJsonc = (value: JsonValue, indent = 2): string => {
  return stringify(value, null, indent);
};

/**
 * Assign properties from source to target while preserving comments.
 * Useful for modifying parsed JSONC while keeping comments intact.
 */
export const assignWithComments = <T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>,
  keys?: string[],
): T => {
  return assign(target, source, keys) as T;
};

/**
 * Extract comments before a specific property key.
 */
export const getCommentsBefore = (obj: unknown, key: string): CommentInfo[] => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];

  const symbol = Symbol.for(`before:${key}`);
  const comments = (obj as Record<string | symbol, unknown>)[symbol];

  if (!Array.isArray(comments)) return [];

  return comments.map((c: { value: string; type: 'LineComment' | 'BlockComment' }) => ({
    text: c.value,
    type: c.type === 'LineComment' ? 'line' : 'block',
  }));
};

/**
 * Check if an object has comment-json properties (i.e., was parsed with comments).
 */
export const hasComments = (obj: unknown): boolean => {
  if (!obj || typeof obj !== 'object') return false;

  const symbols = Object.getOwnPropertySymbols(obj);
  return symbols.some(s => s.description?.startsWith('before') || s.description?.startsWith('after'));
};

export { parse, stringify, assign };