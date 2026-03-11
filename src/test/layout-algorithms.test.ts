import { describe, expect, it } from 'vitest';
import { formatPositionsLeftToRight } from '../utils/layout-algorithms';
import type { BoardState } from '../types/model';

const createState = (): BoardState => ({
  blocks: {
    a: {
      id: 'a',
      title: 'A',
      data: { value: 'a' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    b: {
      id: 'b',
      title: 'B',
      data: { value: 'b' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    c: {
      id: 'c',
      title: 'C',
      data: { value: 'c' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
  positions: {
    a: { x: 0, y: 0 },
    b: { x: 120, y: 120 },
    c: { x: 240, y: 240 },
  },
  links: {
    l1: {
      id: 'l1',
      sourceBlockId: 'a',
      targetBlockId: 'b',
    },
    l2: {
      id: 'l2',
      sourceBlockId: 'b',
      targetBlockId: 'c',
    },
    l3: {
      id: 'l3',
      sourceBlockId: 'a',
      targetBlockId: 'c',
    },
  },
  selectedBlockId: null,
  searchQuery: '',
  version: 1,
});

describe('formatPositionsLeftToRight', () => {
  it('keeps targets to the right of deeper upstream dependencies', async () => {
    const positions = await formatPositionsLeftToRight(createState());

    expect(positions.a?.x).toBeLessThan(positions.b?.x ?? 0);
    expect(positions.b?.x).toBeLessThan(positions.c?.x ?? 0);
  });

  it('falls back to a usable layout when imported links contain a cycle', async () => {
    const state = createState();
    state.links = {
      l1: {
        id: 'l1',
        sourceBlockId: 'a',
        targetBlockId: 'b',
      },
      l2: {
        id: 'l2',
        sourceBlockId: 'b',
        targetBlockId: 'a',
      },
    };

    const positions = await formatPositionsLeftToRight(state);

    expect(positions.a).toBeDefined();
    expect(positions.b).toBeDefined();
  });
});