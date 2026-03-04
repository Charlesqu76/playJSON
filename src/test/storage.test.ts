import { describe, expect, it } from 'vitest';
import { createEmptyState, exportState, importState, loadState, saveState } from '../state/storage';

describe('storage', () => {
  it('roundtrips through save/load and export/import', () => {
    const state = createEmptyState();
    state.blocks.x = {
      id: 'x',
      title: 'Block X',
      data: { key: 'value' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.positions.x = { x: 10, y: 20 };

    saveState(state);
    expect(loadState()).toEqual(state);

    const exported = exportState(state);
    const imported = importState(exported);
    expect(imported.state).toEqual(state);
  });

  it('rejects imports with missing block references in links', () => {
    const bad = JSON.stringify({
      blocks: {},
      positions: {},
      links: {
        l1: {
          id: 'l1',
          sourceBlockId: 'a',
          targetBlockId: 'b',
        },
      },
      selectedBlockId: null,
      searchQuery: '',
      version: 1,
    });

    const imported = importState(bad);
    expect(imported.error).toContain('missing block');
  });
});
