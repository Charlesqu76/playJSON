import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createEmptyState } from './storage';
import type { BoardState, JsonValue } from '../types/model';

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

export type BoardAction =
  | { type: 'createBlock'; payload: CreateBlockPayload }
  | {
      type: 'duplicateSubgraph';
      payload: { rootBlockId: string; offset?: { x: number; y: number } };
    }
  | { type: 'deleteBlock'; payload: { id: string } }
  | { type: 'renameBlock'; payload: { id: string; title: string } }
  | { type: 'selectBlock'; payload: { id: string | null } }
  | { type: 'setSearchQuery'; payload: { query: string } }
  | { type: 'setBlockData'; payload: { id: string; data: JsonValue } }
  | { type: 'setBlockPosition'; payload: { id: string; x: number; y: number } }
  | { type: 'createLink'; payload: CreateLinkPayload }
  | {
      type: 'upsertAttrLink';
      payload: { sourceBlockId: string; sourceAttrKey: string; targetBlockId: string };
    }
  | { type: 'deleteLink'; payload: { id: string } }
  | { type: 'removeAttrLink'; payload: { sourceBlockId: string; sourceAttrKey: string } }
  | {
      type: 'renameAttrLinkKey';
      payload: { sourceBlockId: string; oldKey: string; newKey: string };
    }
  | { type: 'importState'; payload: { state: BoardState } }
  | { type: 'resetBoard' };

const hasDuplicateLink = (
  links: BoardState['links'],
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
  links: BoardState['links'],
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
  links: BoardState['links'],
  sourceBlockId: string,
  targetBlockId: string,
): boolean => hasPath(links, targetBlockId, sourceBlockId);

const remapRefs = (value: JsonValue, idMap: ReadonlyMap<string, string>): JsonValue => {
  if (Array.isArray(value)) {
    return value.map((item) => remapRefs(item, idMap));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const asRecord = value as Record<string, JsonValue>;
  const ref = asRecord.$ref;
  if (typeof ref === 'string' && idMap.has(ref)) {
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

export const boardReducer = (state: BoardState, action: BoardAction): BoardState => {
  switch (action.type) {
    case 'createBlock': {
      const id = uuidv4();
      const now = new Date().toISOString();
      return {
        ...state,
        blocks: {
          ...state.blocks,
          [id]: {
            id,
            title: action.payload.title,
            data: action.payload.data,
            createdAt: now,
            updatedAt: now,
          },
        },
        positions: {
          ...state.positions,
          [id]: action.payload.position,
        },
        selectedBlockId: id,
      };
    }

    case 'duplicateSubgraph': {
      const root = state.blocks[action.payload.rootBlockId];
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
      const offset = action.payload.offset ?? { x: 40, y: 40 };

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
        if (!visited.has(link.sourceBlockId) || !visited.has(link.targetBlockId)) continue;
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
    }

    case 'deleteBlock': {
      const { id } = action.payload;
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
    }

    case 'renameBlock': {
      const block = state.blocks[action.payload.id];
      if (!block) return state;

      return {
        ...state,
        blocks: {
          ...state.blocks,
          [block.id]: {
            ...block,
            title: action.payload.title,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }

    case 'selectBlock':
      return {
        ...state,
        selectedBlockId: action.payload.id,
      };

    case 'setSearchQuery':
      return {
        ...state,
        searchQuery: action.payload.query,
      };

    case 'setBlockData': {
      const block = state.blocks[action.payload.id];
      if (!block) return state;

      let nextLinks = state.links;
      const nextData = action.payload.data;
      if (nextData && typeof nextData === 'object' && !Array.isArray(nextData)) {
        const rootKeys = new Set(Object.keys(nextData));
        nextLinks = Object.fromEntries(
          Object.entries(state.links).filter(([, link]) => {
            if (link.sourceBlockId !== action.payload.id) return true;
            if (!link.sourceAttrKey) return false;
            return rootKeys.has(link.sourceAttrKey);
          }),
        );
      } else if (Array.isArray(nextData)) {
        nextLinks = Object.fromEntries(
          Object.entries(state.links).filter(([, link]) => {
            if (link.sourceBlockId !== action.payload.id) return true;
            if (!link.sourceAttrKey) return false;
            const index = Number(link.sourceAttrKey);
            if (!Number.isInteger(index) || index < 0 || index >= nextData.length) return false;
            const value = nextData[index];
            if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
            return (value as Record<string, unknown>).$ref === link.targetBlockId;
          }),
        );
      } else {
        nextLinks = Object.fromEntries(
          Object.entries(state.links).filter(
            ([, link]) => link.sourceBlockId !== action.payload.id,
          ),
        );
      }

      return {
        ...state,
        blocks: {
          ...state.blocks,
          [block.id]: {
            ...block,
            data: nextData,
            updatedAt: new Date().toISOString(),
          },
        },
        links: nextLinks,
      };
    }

    case 'setBlockPosition': {
      if (!state.positions[action.payload.id]) return state;
      return {
        ...state,
        positions: {
          ...state.positions,
          [action.payload.id]: {
            x: action.payload.x,
            y: action.payload.y,
          },
        },
      };
    }

    case 'createLink': {
      const { sourceBlockId, targetBlockId, sourceAttrKey } = action.payload;
      if (!state.blocks[sourceBlockId] || !state.blocks[targetBlockId]) {
        return state;
      }
      if (sourceBlockId === targetBlockId) {
        return state;
      }
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
    }

    case 'upsertAttrLink': {
      const { sourceBlockId, sourceAttrKey, targetBlockId } = action.payload;
      const sourceBlock = state.blocks[sourceBlockId];
      if (!sourceBlock || !state.blocks[targetBlockId]) return state;
      if (sourceBlockId === targetBlockId) return state;
      if (!sourceAttrKey.trim()) return state;
      const sourceData = sourceBlock.data;
      const isSourceObject = Boolean(sourceData && typeof sourceData === 'object' && !Array.isArray(sourceData));
      const isSourceArray = Array.isArray(sourceData);
      if (!isSourceObject && !isSourceArray) return state;

      const nextLinks = Object.fromEntries(
        Object.entries(state.links).filter(
          ([, link]) =>
            !(
              link.sourceBlockId === sourceBlockId &&
              link.sourceAttrKey === sourceAttrKey
            ) && link.targetBlockId !== targetBlockId,
        ),
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

      let nextData: JsonValue = sourceData as JsonValue;
      if (isSourceObject) {
        if (!Object.prototype.hasOwnProperty.call(sourceData, sourceAttrKey)) return state;
        nextData = {
          ...(sourceData as Record<string, JsonValue>),
          [sourceAttrKey]: {
            $ref: targetBlockId,
          },
        } satisfies Record<string, JsonValue>;
      } else {
        const index = Number(sourceAttrKey);
        if (!Number.isInteger(index) || index < 0 || index >= (sourceData as JsonValue[]).length) {
          return state;
        }
        const arrayNext = [...(sourceData as JsonValue[])];
        arrayNext[index] = {
          $ref: targetBlockId,
        };
        nextData = arrayNext;
      }

      return {
        ...state,
        blocks: {
          ...state.blocks,
          [sourceBlockId]: {
            ...sourceBlock,
            data: nextData,
            updatedAt: new Date().toISOString(),
          },
        },
        links: nextLinks,
      };
    }

    case 'deleteLink': {
      const link = state.links[action.payload.id];
      if (!link) return state;
      const nextLinks = { ...state.links };
      delete nextLinks[action.payload.id];

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
            if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
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
          typeof sourceBlock.data === 'object' &&
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
    }

    case 'removeAttrLink': {
      const { sourceBlockId, sourceAttrKey } = action.payload;
      const nextLinks = Object.fromEntries(
        Object.entries(state.links).filter(
          ([, link]) =>
            !(
              link.sourceBlockId === sourceBlockId &&
              link.sourceAttrKey === sourceAttrKey
            ),
        ),
      );
      return {
        ...state,
        links: nextLinks,
      };
    }

    case 'renameAttrLinkKey': {
      const { sourceBlockId, oldKey, newKey } = action.payload;
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
    }

    case 'importState':
      return action.payload.state;

    case 'resetBoard':
      return createEmptyState();

    default:
      return state;
  }
};

const BoardStateContext = createContext<BoardState | undefined>(undefined);
const BoardDispatchContext = createContext<Dispatch<BoardAction> | undefined>(undefined);

export const BoardProvider = ({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: BoardState;
}) => {
  const [state, dispatch] = useReducer(boardReducer, initialState ?? createEmptyState());

  const memoState = useMemo(() => state, [state]);

  return (
    <BoardStateContext.Provider value={memoState}>
      <BoardDispatchContext.Provider value={dispatch}>
        {children}
      </BoardDispatchContext.Provider>
    </BoardStateContext.Provider>
  );
};

export const useBoardState = (): BoardState => {
  const context = useContext(BoardStateContext);
  if (!context) {
    throw new Error('useBoardState must be used within BoardProvider.');
  }
  return context;
};

export const useBoardDispatch = (): Dispatch<BoardAction> => {
  const context = useContext(BoardDispatchContext);
  if (!context) {
    throw new Error('useBoardDispatch must be used within BoardProvider.');
  }
  return context;
};
