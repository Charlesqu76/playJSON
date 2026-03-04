import { describe, expect, it } from 'vitest';
import { boardReducer } from '../state/board';
import type { BoardState } from '../types/model';

const baseState = (): BoardState => ({
  blocks: {
    a: {
      id: 'a',
      title: 'A',
      data: { ok: true },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    b: {
      id: 'b',
      title: 'B',
      data: { ok: false },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    c: {
      id: 'c',
      title: 'C',
      data: { alt: true },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
  positions: {
    a: { x: 0, y: 0 },
    b: { x: 100, y: 100 },
    c: { x: 200, y: 120 },
  },
  links: {
    l1: {
      id: 'l1',
      sourceBlockId: 'a',
      targetBlockId: 'b',
    },
  },
  selectedBlockId: 'a',
  searchQuery: '',
  version: 1,
});

describe('board reducer', () => {
  it('deletes block and related links', () => {
    const state = boardReducer(baseState(), {
      type: 'deleteBlock',
      payload: { id: 'a' },
    });

    expect(state.blocks.a).toBeUndefined();
    expect(state.links.l1).toBeUndefined();
    expect(state.selectedBlockId).toBeNull();
  });

  it('updates selected block position', () => {
    const state = boardReducer(baseState(), {
      type: 'setBlockPosition',
      payload: { id: 'b', x: 250, y: 360 },
    });

    expect(state.positions.b).toEqual({ x: 250, y: 360 });
  });

  it('prevents duplicate directional links', () => {
    const state = boardReducer(baseState(), {
      type: 'createLink',
      payload: { sourceBlockId: 'a', targetBlockId: 'b' },
    });

    expect(Object.keys(state.links)).toHaveLength(1);
  });

  it('updates source attribute value when linking an attribute', () => {
    const initial = baseState();
    initial.blocks.a.data = { user: 'old' };
    initial.links = {};

    const state = boardReducer(initial, {
      type: 'upsertAttrLink',
      payload: { sourceBlockId: 'a', sourceAttrKey: 'user', targetBlockId: 'b' },
    });

    expect(Object.values(state.links)).toHaveLength(1);
    expect(state.blocks.a.data).toEqual({
      user: { $ref: 'b' },
    });
  });

  it('allows only one incoming attribute link per target block', () => {
    const initial = baseState();
    initial.blocks.a.data = { user: 'old' };
    initial.blocks.c.data = { profile: 'old' };
    initial.links = {};

    const first = boardReducer(initial, {
      type: 'upsertAttrLink',
      payload: { sourceBlockId: 'a', sourceAttrKey: 'user', targetBlockId: 'b' },
    });

    const second = boardReducer(first, {
      type: 'upsertAttrLink',
      payload: { sourceBlockId: 'c', sourceAttrKey: 'profile', targetBlockId: 'b' },
    });

    const links = Object.values(second.links).filter((link) => link.targetBlockId === 'b');
    expect(links).toHaveLength(1);
    expect(links[0]?.sourceBlockId).toBe('c');
    expect(links[0]?.sourceAttrKey).toBe('profile');
    expect(second.blocks.a.data).toEqual({ user: null });
    expect(second.blocks.c.data).toEqual({ profile: { $ref: 'b' } });
  });

  it('resets displaced array source values when replacing a target link', () => {
    const initial = baseState();
    initial.blocks.a.data = [{ $ref: 'b' }];
    initial.blocks.c.data = { profile: 'old' };
    initial.links = {
      link1: {
        id: 'link1',
        sourceBlockId: 'a',
        sourceAttrKey: '0',
        targetBlockId: 'b',
      },
    };

    const state = boardReducer(initial, {
      type: 'upsertAttrLink',
      payload: { sourceBlockId: 'c', sourceAttrKey: 'profile', targetBlockId: 'b' },
    });

    expect(state.blocks.a.data).toEqual([null]);
    expect(state.blocks.c.data).toEqual({ profile: { $ref: 'b' } });
    expect(Object.values(state.links)).toHaveLength(1);
  });

  it('moves object attributes into target object blocks when dropped', () => {
    const initial = baseState();
    initial.blocks.a.data = { user: 'charles' };
    initial.blocks.b.data = { ok: false };
    initial.links = {};

    const state = boardReducer(initial, {
      type: 'moveAttrToBlock',
      payload: { sourceBlockId: 'a', sourceAttrKey: 'user', targetBlockId: 'b' },
    });

    expect(state.blocks.a.data).toEqual({ user: null });
    expect(state.blocks.b.data).toEqual({ ok: false, user: 'charles' });
  });

  it('moves array items into target array blocks when dropped', () => {
    const initial = baseState();
    initial.blocks.a.data = ['x', null];
    initial.blocks.b.data = ['y'];
    initial.links = {};

    const state = boardReducer(initial, {
      type: 'moveAttrToBlock',
      payload: { sourceBlockId: 'a', sourceAttrKey: '0', targetBlockId: 'b' },
    });

    expect(state.blocks.a.data).toEqual([null, null]);
    expect(state.blocks.b.data).toEqual(['y', 'x']);
  });

  it('moves values into primitive target blocks by wrapping as array', () => {
    const initial = baseState();
    initial.blocks.a.data = { user: 'charles' };
    initial.blocks.b.data = 'base';
    initial.links = {};

    const state = boardReducer(initial, {
      type: 'moveAttrToBlock',
      payload: { sourceBlockId: 'a', sourceAttrKey: 'user', targetBlockId: 'b' },
    });

    expect(state.blocks.a.data).toEqual({ user: null });
    expect(state.blocks.b.data).toEqual(['base', 'charles']);
  });

  it('keeps moved attribute links attached to the new target location', () => {
    const initial = baseState();
    initial.blocks.a.data = { user: { $ref: 'c' } };
    initial.blocks.b.data = {};
    initial.links = {
      link1: {
        id: 'link1',
        sourceBlockId: 'a',
        sourceAttrKey: 'user',
        targetBlockId: 'c',
      },
    };

    const state = boardReducer(initial, {
      type: 'moveAttrToBlock',
      payload: { sourceBlockId: 'a', sourceAttrKey: 'user', targetBlockId: 'b' },
    });

    expect(state.blocks.a.data).toEqual({ user: null });
    expect(state.blocks.b.data).toEqual({ user: { $ref: 'c' } });
    const movedLink = Object.values(state.links)[0];
    expect(movedLink?.sourceBlockId).toBe('b');
    expect(movedLink?.sourceAttrKey).toBe('user');
    expect(movedLink?.targetBlockId).toBe('c');
  });

  it('sets linked source value to null when deleting a link', () => {
    const initial = baseState();
    initial.blocks.a.data = { user: { $ref: 'b' } };
    initial.links = {
      link1: {
        id: 'link1',
        sourceBlockId: 'a',
        sourceAttrKey: 'user',
        targetBlockId: 'b',
      },
    };

    const state = boardReducer(initial, {
      type: 'deleteLink',
      payload: { id: 'link1' },
    });

    expect(state.links.link1).toBeUndefined();
    expect(state.blocks.a.data).toEqual({ user: null });
  });

  it('supports linking array index and nulls it when link is deleted', () => {
    const initial = baseState();
    initial.blocks.a.data = ['x', null];
    initial.links = {};

    const linked = boardReducer(initial, {
      type: 'upsertAttrLink',
      payload: { sourceBlockId: 'a', sourceAttrKey: '0', targetBlockId: 'b' },
    });

    expect(linked.blocks.a.data).toEqual([{ $ref: 'b' }, null]);
    const link = Object.values(linked.links)[0];
    expect(link?.sourceAttrKey).toBe('0');

    const afterDelete = boardReducer(linked, {
      type: 'deleteLink',
      payload: { id: link.id },
    });
    expect(afterDelete.blocks.a.data).toEqual([null, null]);
  });
});
