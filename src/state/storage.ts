import { boardStateSchema, type BoardState } from "../types/model";

export const createEmptyState = (): BoardState => ({
  blocks: {},
  positions: {},
  links: {},
  selectedBlockId: null,
  searchQuery: "",
  version: 1,
});

export const exportState = (state: BoardState): string =>
  JSON.stringify(state, null, 2);

export const importState = (
  text: string,
): { state?: BoardState; error?: string } => {
  try {
    const parsed = JSON.parse(text) as unknown;
    const result = boardStateSchema.safeParse(parsed);
    if (!result.success) {
      return {
        error: result.error.issues[0]?.message ?? "Invalid board data.",
      };
    }

    const blockIds = new Set(Object.keys(result.data.blocks));
    for (const link of Object.values(result.data.links)) {
      if (
        !blockIds.has(link.sourceBlockId) ||
        !blockIds.has(link.targetBlockId)
      ) {
        return { error: "Link references a missing block." };
      }
    }

    return { state: result.data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to import state.",
    };
  }
};
