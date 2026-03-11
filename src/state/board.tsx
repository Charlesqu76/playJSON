import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { v4 as uuidv4 } from "uuid";
import { createEmptyState } from "./storage";
import type { BoardState, JsonValue } from "../types/model";

interface CreateBlockPayload {
  title: string;
  data: JsonValue;
  position: { x: number; y: number };
}

interface CreateLinkPayload {
  sourceBlockId: string;
  targetBlockId: string;
  sourceAttrKey?: string;
}

interface DuplicateSubgraphPayload {
  rootBlockId: string;
  offset?: { x: number; y: number };
}

interface UpsertAttrLinkPayload {
  sourceBlockId: string;
  sourceAttrKey: string;
  targetBlockId: string;
}

interface MoveAttrToBlockPayload {
  sourceBlockId: string;
  sourceAttrKey: string;
  targetBlockId: string;
}

interface RenameAttrLinkKeyPayload {
  sourceBlockId: string;
  oldKey: string;
  newKey: string;
}

const hasDuplicateLink = (
  links: BoardState["links"],
  sourceBlockId: string,
  targetBlockId: string,
  sourceAttrKey?: string,
): boolean =>
  Object.values(links).some(
    (link) =>
      link.sourceBlockId === sourceBlockId &&
      link.targetBlockId === targetBlockId &&
      link.sourceAttrKey === sourceAttrKey,
  );

const hasPath = (
  links: BoardState["links"],
  fromBlockId: string,
  toBlockId: string,
): boolean => {
  if (fromBlockId === toBlockId) return true;

  const outgoing = new Map<string, string[]>();
  for (const link of Object.values(links)) {
    const next = outgoing.get(link.sourceBlockId) ?? [];
    next.push(link.targetBlockId);
    outgoing.set(link.sourceBlockId, next);
  }

  const visited = new Set<string>();
  const stack = [fromBlockId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    const targets = outgoing.get(current) ?? [];
    for (const target of targets) {
      if (target === toBlockId) return true;
      if (!visited.has(target)) stack.push(target);
    }
  }

  return false;
};

const wouldCreateCycle = (
  links: BoardState["links"],
  sourceBlockId: string,
  targetBlockId: string,
): boolean => hasPath(links, targetBlockId, sourceBlockId);

const remapRefs = (
  value: JsonValue,
  idMap: ReadonlyMap<string, string>,
): JsonValue => {
  if (Array.isArray(value)) {
    return value.map((item) => remapRefs(item, idMap));
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  const asRecord = value as Record<string, JsonValue>;
  const ref = asRecord.$ref;
  if (typeof ref === "string" && idMap.has(ref)) {
    return {
      ...asRecord,
      $ref: idMap.get(ref) as string,
    };
  }

  const next: Record<string, JsonValue> = {};
  for (const [key, nested] of Object.entries(asRecord)) {
    next[key] = remapRefs(nested, idMap);
  }
  return next;
};

const setAttributeValue = (
  block: BoardState["blocks"][string],
  sourceAttrKey: string,
  nextValue: JsonValue,
): JsonValue | null => {
  if (Array.isArray(block.data)) {
    const index = Number(sourceAttrKey);
    if (!Number.isInteger(index) || index < 0 || index >= block.data.length)
      return null;
    const nextArray = [...block.data];
    nextArray[index] = nextValue;
    return nextArray;
  }
  if (block.data && typeof block.data === "object") {
    if (!Object.prototype.hasOwnProperty.call(block.data, sourceAttrKey)) {
      return null;
    }
    return {
      ...(block.data as Record<string, JsonValue>),
      [sourceAttrKey]: nextValue,
    } satisfies Record<string, JsonValue>;
  }
  return null;
};

const getAttributeValue = (
  block: BoardState["blocks"][string],
  sourceAttrKey: string,
): JsonValue | undefined => {
  if (Array.isArray(block.data)) {
    const index = Number(sourceAttrKey);
    if (!Number.isInteger(index) || index < 0 || index >= block.data.length)
      return undefined;
    return block.data[index] as JsonValue;
  }
  if (block.data && typeof block.data === "object") {
    if (!Object.prototype.hasOwnProperty.call(block.data, sourceAttrKey))
      return undefined;
    return (block.data as Record<string, JsonValue>)[sourceAttrKey];
  }
  return undefined;
};

const nextObjectKey = (
  target: Record<string, JsonValue>,
  baseKey: string,
): string => {
  const normalizedBase = baseKey.trim() || "item";
  if (!Object.prototype.hasOwnProperty.call(target, normalizedBase))
    return normalizedBase;
  let index = 1;
  let candidate = `${normalizedBase}_${index}`;
  while (Object.prototype.hasOwnProperty.call(target, candidate)) {
    index += 1;
    candidate = `${normalizedBase}_${index}`;
  }
  return candidate;
};

const moveValueIntoTarget = (
  targetBlock: BoardState["blocks"][string],
  sourceAttrKey: string,
  value: JsonValue,
): { data: JsonValue; targetAttrKey: string } | null => {
  if (Array.isArray(targetBlock.data)) {
    const nextArray = [...targetBlock.data, value];
    return {
      data: nextArray,
      targetAttrKey: String(nextArray.length - 1),
    };
  }

  if (targetBlock.data && typeof targetBlock.data === "object") {
    const targetObject = targetBlock.data as Record<string, JsonValue>;
    const numericIndex = Number(sourceAttrKey);
    const preferredKey =
      Number.isInteger(numericIndex) && numericIndex >= 0
        ? `item_${numericIndex}`
        : sourceAttrKey;
    const targetAttrKey = nextObjectKey(targetObject, preferredKey);
    return {
      data: {
        ...targetObject,
        [targetAttrKey]: value,
      } satisfies Record<string, JsonValue>,
      targetAttrKey,
    };
  }

  return {
    data: [targetBlock.data, value],
    targetAttrKey: "1",
  };
};

const createBlockState = (
  state: BoardState,
  payload: CreateBlockPayload,
): BoardState => {
  const id = uuidv4();
  const now = new Date().toISOString();
  return {
    ...state,
    blocks: {
      ...state.blocks,
      [id]: {
        id,
        title: payload.title,
        data: payload.data,
        createdAt: now,
        updatedAt: now,
      },
    },
    positions: {
      ...state.positions,
      [id]: payload.position,
    },
    selectedBlockId: id,
  };
};

const duplicateSubgraphState = (
  state: BoardState,
  payload: DuplicateSubgraphPayload,
): BoardState => {
  const root = state.blocks[payload.rootBlockId];
  if (!root) return state;

  const outgoing = new Map<string, string[]>();
  for (const link of Object.values(state.links)) {
    const next = outgoing.get(link.sourceBlockId) ?? [];
    next.push(link.targetBlockId);
    outgoing.set(link.sourceBlockId, next);
  }

  const visited = new Set<string>();
  const stack = [root.id];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    for (const target of outgoing.get(current) ?? []) {
      if (!visited.has(target)) stack.push(target);
    }
  }

  const subgraphIds = [...visited];
  const idMap = new Map<string, string>();
  for (const oldId of subgraphIds) {
    idMap.set(oldId, uuidv4());
  }

  const now = new Date().toISOString();
  const offset = payload.offset ?? { x: 40, y: 40 };
  const nextBlocks = { ...state.blocks };
  const nextPositions = { ...state.positions };

  for (const oldId of subgraphIds) {
    const oldBlock = state.blocks[oldId];
    const nextId = idMap.get(oldId);
    if (!oldBlock || !nextId) continue;
    nextBlocks[nextId] = {
      id: nextId,
      title: oldId === root.id ? `${oldBlock.title} Copy` : oldBlock.title,
      data: remapRefs(oldBlock.data, idMap),
      createdAt: now,
      updatedAt: now,
    };
    const oldPos = state.positions[oldId] ?? { x: 100, y: 100 };
    nextPositions[nextId] = {
      x: oldPos.x + offset.x,
      y: oldPos.y + offset.y,
    };
  }

  const nextLinks = { ...state.links };
  for (const link of Object.values(state.links)) {
    if (!visited.has(link.sourceBlockId) || !visited.has(link.targetBlockId)) {
      continue;
    }
    const sourceBlockId = idMap.get(link.sourceBlockId);
    const targetBlockId = idMap.get(link.targetBlockId);
    if (!sourceBlockId || !targetBlockId) continue;
    const id = uuidv4();
    nextLinks[id] = {
      ...link,
      id,
      sourceBlockId,
      targetBlockId,
    };
  }

  return {
    ...state,
    blocks: nextBlocks,
    positions: nextPositions,
    links: nextLinks,
    selectedBlockId: idMap.get(root.id) ?? state.selectedBlockId,
  };
};

const deleteBlockState = (state: BoardState, id: string): BoardState => {
  if (!state.blocks[id]) return state;

  const nextBlocks = { ...state.blocks };
  delete nextBlocks[id];

  const nextPositions = { ...state.positions };
  delete nextPositions[id];

  const nextLinks = Object.fromEntries(
    Object.entries(state.links).filter(
      ([, link]) => link.sourceBlockId !== id && link.targetBlockId !== id,
    ),
  );

  return {
    ...state,
    blocks: nextBlocks,
    positions: nextPositions,
    links: nextLinks,
    selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
  };
};

const renameBlockState = (
  state: BoardState,
  id: string,
  title: string,
): BoardState => {
  const block = state.blocks[id];
  if (!block) return state;

  return {
    ...state,
    blocks: {
      ...state.blocks,
      [block.id]: {
        ...block,
        title,
        updatedAt: new Date().toISOString(),
      },
    },
  };
};

const selectBlockState = (state: BoardState, id: string | null): BoardState => ({
  ...state,
  selectedBlockId: id,
});

const setSearchQueryState = (state: BoardState, query: string): BoardState => ({
  ...state,
  searchQuery: query,
});

const setBlockDataState = (
  state: BoardState,
  id: string,
  data: JsonValue,
): BoardState => {
  const block = state.blocks[id];
  if (!block) return state;

  let nextLinks = state.links;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const rootKeys = new Set(Object.keys(data));
    nextLinks = Object.fromEntries(
      Object.entries(state.links).filter(([, link]) => {
        if (link.sourceBlockId !== id) return true;
        if (link.sourceAttrKey === undefined) return true;
        return rootKeys.has(link.sourceAttrKey);
      }),
    );
  } else if (Array.isArray(data)) {
    nextLinks = Object.fromEntries(
      Object.entries(state.links).filter(([, link]) => {
        if (link.sourceBlockId !== id) return true;
        if (link.sourceAttrKey === undefined) return true;
        const index = Number(link.sourceAttrKey);
        if (!Number.isInteger(index) || index < 0 || index >= data.length) {
          return false;
        }
        const value = data[index];
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          return false;
        }
        return (value as Record<string, unknown>).$ref === link.targetBlockId;
      }),
    );
  } else {
    nextLinks = Object.fromEntries(
      Object.entries(state.links).filter(([, link]) => link.sourceBlockId !== id),
    );
  }

  return {
    ...state,
    blocks: {
      ...state.blocks,
      [block.id]: {
        ...block,
        data,
        updatedAt: new Date().toISOString(),
      },
    },
    links: nextLinks,
  };
};

const setBlockPositionState = (
  state: BoardState,
  id: string,
  x: number,
  y: number,
): BoardState => {
  if (!state.positions[id]) return state;
  return {
    ...state,
    positions: {
      ...state.positions,
      [id]: { x, y },
    },
  };
};

const createLinkState = (
  state: BoardState,
  payload: CreateLinkPayload,
): BoardState => {
  const { sourceBlockId, targetBlockId, sourceAttrKey } = payload;
  if (!state.blocks[sourceBlockId] || !state.blocks[targetBlockId]) {
    return state;
  }
  if (sourceBlockId === targetBlockId) return state;
  if (hasDuplicateLink(state.links, sourceBlockId, targetBlockId, sourceAttrKey)) {
    return state;
  }
  if (wouldCreateCycle(state.links, sourceBlockId, targetBlockId)) {
    return state;
  }

  const id = uuidv4();
  return {
    ...state,
    links: {
      ...state.links,
      [id]: {
        id,
        sourceBlockId,
        targetBlockId,
        sourceAttrKey,
      },
    },
  };
};

const upsertAttrLinkState = (
  state: BoardState,
  payload: UpsertAttrLinkPayload,
): BoardState => {
  const { sourceBlockId, sourceAttrKey, targetBlockId } = payload;
  const sourceBlock = state.blocks[sourceBlockId];
  const targetBlock = state.blocks[targetBlockId];
  if (!sourceBlock || !targetBlock) return state;
  if (sourceBlockId === targetBlockId) return state;
  if (!sourceAttrKey.trim()) return state;

  const nextSourceData = setAttributeValue(sourceBlock, sourceAttrKey, {
    $ref: targetBlockId,
  });
  if (!nextSourceData) return state;

  const removedLinks: BoardState["links"][string][] = [];
  const nextLinks = Object.fromEntries(
    Object.entries(state.links).filter(([, link]) => {
      const shouldRemove =
        (link.sourceBlockId === sourceBlockId &&
          link.sourceAttrKey === sourceAttrKey) ||
        (link.targetBlockId === targetBlockId && link.sourceAttrKey !== undefined);
      if (shouldRemove) removedLinks.push(link);
      return !shouldRemove;
    }),
  );
  if (wouldCreateCycle(nextLinks, sourceBlockId, targetBlockId)) {
    return state;
  }

  const id = uuidv4();
  nextLinks[id] = {
    id,
    sourceBlockId,
    sourceAttrKey,
    targetBlockId,
  };

  const now = new Date().toISOString();
  const nextBlocks: BoardState["blocks"] = {
    ...state.blocks,
    [sourceBlockId]: {
      ...sourceBlock,
      data: nextSourceData,
      updatedAt: now,
    },
    [targetBlockId]: {
      ...targetBlock,
      updatedAt: now,
    },
  };

  for (const removedLink of removedLinks) {
    if (!removedLink.sourceAttrKey) continue;
    if (
      removedLink.sourceBlockId === sourceBlockId &&
      removedLink.sourceAttrKey === sourceAttrKey
    ) {
      continue;
    }
    const removedSourceBlock = nextBlocks[removedLink.sourceBlockId];
    if (!removedSourceBlock) continue;
    const resetSourceData = setAttributeValue(
      removedSourceBlock,
      removedLink.sourceAttrKey,
      null,
    );
    if (!resetSourceData) continue;
    nextBlocks[removedLink.sourceBlockId] = {
      ...removedSourceBlock,
      data: resetSourceData,
      updatedAt: now,
    };
  }

  return {
    ...state,
    blocks: nextBlocks,
    links: nextLinks,
  };
};

const moveAttrToBlockState = (
  state: BoardState,
  payload: MoveAttrToBlockPayload,
): BoardState => {
  const { sourceBlockId, sourceAttrKey, targetBlockId } = payload;
  if (sourceBlockId === targetBlockId) return state;

  const sourceBlock = state.blocks[sourceBlockId];
  const targetBlock = state.blocks[targetBlockId];
  if (!sourceBlock || !targetBlock) return state;

  const sourceValue = getAttributeValue(sourceBlock, sourceAttrKey);
  if (sourceValue === undefined) return state;

  let nextSourceData: JsonValue;
  if (Array.isArray(sourceBlock.data)) {
    const result = setAttributeValue(sourceBlock, sourceAttrKey, null);
    if (!result) return state;
    nextSourceData = result;
  } else if (sourceBlock.data && typeof sourceBlock.data === "object") {
    const { [sourceAttrKey]: _removed, ...rest } = sourceBlock.data as Record<
      string,
      JsonValue
    >;
    nextSourceData = rest;
  } else {
    return state;
  }

  const movedTarget = moveValueIntoTarget(targetBlock, sourceAttrKey, sourceValue);
  if (!movedTarget) return state;

  const movedLinks = Object.values(state.links).filter(
    (link) =>
      link.sourceBlockId === sourceBlockId && link.sourceAttrKey === sourceAttrKey,
  );
  const nextLinks = Object.fromEntries(
    Object.entries(state.links).filter(
      ([, link]) =>
        !(link.sourceBlockId === sourceBlockId && link.sourceAttrKey === sourceAttrKey),
    ),
  );

  for (const movedLink of movedLinks) {
    if (wouldCreateCycle(nextLinks, targetBlockId, movedLink.targetBlockId)) {
      continue;
    }
    const id = uuidv4();
    nextLinks[id] = {
      id,
      sourceBlockId: targetBlockId,
      sourceAttrKey: movedTarget.targetAttrKey,
      targetBlockId: movedLink.targetBlockId,
    };
  }

  const now = new Date().toISOString();
  return {
    ...state,
    blocks: {
      ...state.blocks,
      [sourceBlockId]: {
        ...sourceBlock,
        data: nextSourceData,
        updatedAt: now,
      },
      [targetBlockId]: {
        ...targetBlock,
        data: movedTarget.data,
        updatedAt: now,
      },
    },
    links: nextLinks,
  };
};

const deleteLinkState = (state: BoardState, id: string): BoardState => {
  const link = state.links[id];
  if (!link) return state;

  const nextLinks = { ...state.links };
  delete nextLinks[id];

  const sourceBlock = state.blocks[link.sourceBlockId];
  if (!sourceBlock) {
    return {
      ...state,
      links: nextLinks,
    };
  }

  let nextSourceData = sourceBlock.data;
  if (Array.isArray(sourceBlock.data)) {
    const nextArray = [...sourceBlock.data];
    let index = -1;
    if (link.sourceAttrKey !== undefined) {
      const parsed = Number(link.sourceAttrKey);
      if (Number.isInteger(parsed) && parsed >= 0 && parsed < nextArray.length) {
        index = parsed;
      }
    }
    if (index < 0) {
      index = nextArray.findIndex((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return false;
        return (item as Record<string, unknown>).$ref === link.targetBlockId;
      });
    }
    if (index >= 0) {
      nextArray[index] = null;
      nextSourceData = nextArray;
    }
  } else if (link.sourceAttrKey) {
    if (
      sourceBlock.data &&
      typeof sourceBlock.data === "object" &&
      !Array.isArray(sourceBlock.data) &&
      Object.prototype.hasOwnProperty.call(sourceBlock.data, link.sourceAttrKey)
    ) {
      nextSourceData = {
        ...(sourceBlock.data as Record<string, JsonValue>),
        [link.sourceAttrKey]: null,
      };
    }
  }

  const sourceChanged = nextSourceData !== sourceBlock.data;
  return {
    ...state,
    links: nextLinks,
    blocks: sourceChanged
      ? {
          ...state.blocks,
          [sourceBlock.id]: {
            ...sourceBlock,
            data: nextSourceData,
            updatedAt: new Date().toISOString(),
          },
        }
      : state.blocks,
  };
};

const removeAttrLinkState = (
  state: BoardState,
  sourceBlockId: string,
  sourceAttrKey: string,
): BoardState => {
  const nextLinks = Object.fromEntries(
    Object.entries(state.links).filter(
      ([, link]) =>
        !(link.sourceBlockId === sourceBlockId && link.sourceAttrKey === sourceAttrKey),
    ),
  );
  const sourceBlock = state.blocks[sourceBlockId];
  if (sourceBlock) {
    const resetData = setAttributeValue(sourceBlock, sourceAttrKey, null);
    if (resetData) {
      return {
        ...state,
        links: nextLinks,
        blocks: {
          ...state.blocks,
          [sourceBlockId]: {
            ...sourceBlock,
            data: resetData,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }
  }

  return {
    ...state,
    links: nextLinks,
  };
};

const renameAttrLinkKeyState = (
  state: BoardState,
  payload: RenameAttrLinkKeyPayload,
): BoardState => {
  const { sourceBlockId, oldKey, newKey } = payload;
  if (oldKey === newKey) return state;

  const nextLinks = Object.fromEntries(
    Object.entries(state.links).map(([id, link]) => {
      if (link.sourceBlockId !== sourceBlockId || link.sourceAttrKey !== oldKey) {
        return [id, link];
      }
      return [
        id,
        {
          ...link,
          sourceAttrKey: newKey,
        },
      ];
    }),
  );

  return {
    ...state,
    links: nextLinks,
  };
};

export interface BoardStoreActions {
  createBlock: (payload: CreateBlockPayload) => void;
  duplicateSubgraph: (payload: DuplicateSubgraphPayload) => void;
  deleteBlock: (id: string) => void;
  renameBlock: (id: string, title: string) => void;
  selectBlock: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setBlockData: (id: string, data: JsonValue) => void;
  setBlockPosition: (id: string, x: number, y: number) => void;
  createLink: (payload: CreateLinkPayload) => void;
  upsertAttrLink: (payload: UpsertAttrLinkPayload) => void;
  moveAttrToBlock: (payload: MoveAttrToBlockPayload) => void;
  deleteLink: (id: string) => void;
  removeAttrLink: (sourceBlockId: string, sourceAttrKey: string) => void;
  renameAttrLinkKey: (payload: RenameAttrLinkKeyPayload) => void;
  importState: (state: BoardState) => void;
  resetBoard: () => void;
}

interface BoardStore extends BoardStoreActions {
  state: BoardState;
}

const useBoardStore = create<BoardStore>((set) => ({
  state: createEmptyState(),
  createBlock: (payload) =>
    set((current) => ({
      state: createBlockState(current.state, payload),
    })),
  duplicateSubgraph: (payload) =>
    set((current) => ({
      state: duplicateSubgraphState(current.state, payload),
    })),
  deleteBlock: (id) =>
    set((current) => ({
      state: deleteBlockState(current.state, id),
    })),
  renameBlock: (id, title) =>
    set((current) => ({
      state: renameBlockState(current.state, id, title),
    })),
  selectBlock: (id) =>
    set((current) => ({
      state: selectBlockState(current.state, id),
    })),
  setSearchQuery: (query) =>
    set((current) => ({
      state: setSearchQueryState(current.state, query),
    })),
  setBlockData: (id, data) =>
    set((current) => ({
      state: setBlockDataState(current.state, id, data),
    })),
  setBlockPosition: (id, x, y) =>
    set((current) => ({
      state: setBlockPositionState(current.state, id, x, y),
    })),
  createLink: (payload) =>
    set((current) => ({
      state: createLinkState(current.state, payload),
    })),
  upsertAttrLink: (payload) =>
    set((current) => ({
      state: upsertAttrLinkState(current.state, payload),
    })),
  moveAttrToBlock: (payload) =>
    set((current) => ({
      state: moveAttrToBlockState(current.state, payload),
    })),
  deleteLink: (id) =>
    set((current) => ({
      state: deleteLinkState(current.state, id),
    })),
  removeAttrLink: (sourceBlockId, sourceAttrKey) =>
    set((current) => ({
      state: removeAttrLinkState(current.state, sourceBlockId, sourceAttrKey),
    })),
  renameAttrLinkKey: (payload) =>
    set((current) => ({
      state: renameAttrLinkKeyState(current.state, payload),
    })),
  importState: (state) =>
    set(() => ({ state })),
  resetBoard: () =>
    set(() => ({ state: createEmptyState() })),
}));

export const boardStore = useBoardStore;

export const initializeBoardStore = (initialState?: BoardState): void => {
  useBoardStore.setState({
    state: initialState ?? createEmptyState(),
  });
};

export const useBoardState = (): BoardState =>
  useBoardStore((store) => store.state);

export const useBoardActions = (): BoardStoreActions =>
  useBoardStore(
    useShallow((store) => ({
      createBlock: store.createBlock,
      duplicateSubgraph: store.duplicateSubgraph,
      deleteBlock: store.deleteBlock,
      renameBlock: store.renameBlock,
      selectBlock: store.selectBlock,
      setSearchQuery: store.setSearchQuery,
      setBlockData: store.setBlockData,
      setBlockPosition: store.setBlockPosition,
      createLink: store.createLink,
      upsertAttrLink: store.upsertAttrLink,
      moveAttrToBlock: store.moveAttrToBlock,
      deleteLink: store.deleteLink,
      removeAttrLink: store.removeAttrLink,
      renameAttrLinkKey: store.renameAttrLinkKey,
      importState: store.importState,
      resetBoard: store.resetBoard,
    })),
  );
