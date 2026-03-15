import type { BoardState, JsonValue } from '../types/model';
import {
  BLOCK_BASE_HEIGHT,
  BLOCK_ROW_HEIGHT,
  BLOCK_FOOTER_HEIGHT,
  DEFAULT_BLOCK_HEIGHT,
} from './workspace-constants';
import { isRootObject } from './json-blocks';

/**
 * Estimate the height of a block based on its data content
 */
export const estimateBlockHeight = (
  data: JsonValue,
  visibleArrayCount?: number,
): number => {
  if (Array.isArray(data)) {
    const count = visibleArrayCount ?? data.length;
    return BLOCK_BASE_HEIGHT + count * BLOCK_ROW_HEIGHT + BLOCK_FOOTER_HEIGHT;
  }
  if (isRootObject(data)) {
    return BLOCK_BASE_HEIGHT + Object.keys(data).length * BLOCK_ROW_HEIGHT + BLOCK_FOOTER_HEIGHT;
  }
  return DEFAULT_BLOCK_HEIGHT;
};

/**
 * Sort block IDs by their current position on the canvas
 */
export const sortByCurrentPosition = (state: BoardState, a: string, b: string): number => {
  const posA = state.positions[a] ?? { x: 0, y: 0 };
  const posB = state.positions[b] ?? { x: 0, y: 0 };
  if (posA.y !== posB.y) return posA.y - posB.y;
  if (posA.x !== posB.x) return posA.x - posB.x;
  const titleA = state.blocks[a]?.title;
  const titleB = state.blocks[b]?.title;
  if (titleA && titleB) return titleA.localeCompare(titleB);
  if (titleA) return -1;
  if (titleB) return 1;
  return a.localeCompare(b);
};

/**
 * Get all descendant blocks that are hidden due to collapsing
 */
export const getHiddenDescendants = (
  state: BoardState,
  collapsedBlockIds: ReadonlySet<string>,
): Set<string> => {
  if (collapsedBlockIds.size === 0) return new Set<string>();

  const outgoing = new Map<string, string[]>();
  for (const link of Object.values(state.links)) {
    const next = outgoing.get(link.sourceBlockId) ?? [];
    next.push(link.targetBlockId);
    outgoing.set(link.sourceBlockId, next);
  }

  const hidden = new Set<string>();
  const seen = new Set<string>();
  const stack = [...collapsedBlockIds];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    for (const target of outgoing.get(current) ?? []) {
      if (!hidden.has(target)) {
        hidden.add(target);
        stack.push(target);
      }
    }
  }

  return hidden;
};
