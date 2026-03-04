import { boardStateSchema, type BoardState } from '../types/model';

const STORAGE_KEY = 'json-visual-board-v1';

export const createEmptyState = (): BoardState => ({
  blocks: {},
  positions: {},
  links: {},
  selectedBlockId: null,
  searchQuery: '',
  version: 1,
});

export const loadState = (): BoardState => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createEmptyState();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = boardStateSchema.safeParse(parsed);
    if (!result.success) {
      return createEmptyState();
    }

    return result.data;
  } catch {
    return createEmptyState();
  }
};

export const saveState = (state: BoardState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const exportState = (state: BoardState): string => JSON.stringify(state, null, 2);

export const importState = (text: string): { state?: BoardState; error?: string } => {
  try {
    const parsed = JSON.parse(text) as unknown;
    const result = boardStateSchema.safeParse(parsed);
    if (!result.success) {
      return { error: result.error.issues[0]?.message ?? 'Invalid board data.' };
    }

    const blockIds = new Set(Object.keys(result.data.blocks));
    for (const link of Object.values(result.data.links)) {
      if (!blockIds.has(link.sourceBlockId) || !blockIds.has(link.targetBlockId)) {
        return { error: 'Link references a missing block.' };
      }
    }

    return { state: result.data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to import state.',
    };
  }
};
