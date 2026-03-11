import { v4 as uuidv4 } from 'uuid';
import type { BoardState, JsonObject, JsonValue } from '../types/model';

/**
 * Type guard for root objects (plain objects, not arrays)
 */
export const isRootObject = (value: JsonValue): value is JsonObject =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

/**
 * Type guard for reference objects
 */
export const isRefObject = (value: JsonValue): value is { $ref: string } =>
  Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof (value as Record<string, unknown>).$ref === 'string',
  );

/**
 * Type guard for composite values (objects or arrays)
 */
export const isCompositeValue = (value: JsonValue): value is JsonObject | JsonValue[] =>
  isRootObject(value) || Array.isArray(value);

/**
 * Append a null item to a root array
 */
export const addItemOnArray = (value: JsonValue): JsonValue => {
  if (!Array.isArray(value)) return value;
  return [...value, null];
};

/**
 * Add a new attribute to a root object
 */
export const addAttributeOnRootObject = (value: JsonValue): JsonValue => {
  if (!isRootObject(value)) return value;
  let idx = 1;
  let key = `new_attr_${idx}`;
  while (Object.prototype.hasOwnProperty.call(value, key)) {
    idx += 1;
    key = `new_attr_${idx}`;
  }
  return {
    ...value,
    [key]: null,
  };
};

/**
 * Resolve references recursively through the block graph
 */
export const resolveReferences = (
  value: JsonValue,
  blocksById: Map<string, BoardState['blocks'][string]>,
  seen: Set<string>,
): JsonValue => {
  if (Array.isArray(value)) {
    return value.map((item) => resolveReferences(item, blocksById, seen));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (isRefObject(value)) {
    const refId = value.$ref;
    if (seen.has(refId)) return value;
    const target = blocksById.get(refId);
    if (!target) return value;
    const nextSeen = new Set(seen);
    nextSeen.add(refId);
    return resolveReferences(target.data, blocksById, nextSeen);
  }

  const next: Record<string, JsonValue> = {};
  for (const [key, nested] of Object.entries(value as JsonObject)) {
    next[key] = resolveReferences(nested, blocksById, seen);
  }
  return next;
};

/**
 * Resolve a block's value by replacing references with actual data
 */
export const resolveBlockValue = (state: BoardState, blockId: string): JsonValue | null => {
  const block = state.blocks[blockId];
  if (!block) return null;

  const byId = new Map(Object.values(state.blocks).map((candidate) => [candidate.id, candidate]));
  let seeded = block.data;
  if (isRootObject(seeded)) {
    const nextRoot: JsonObject = { ...seeded };
    for (const link of Object.values(state.links)) {
      if (link.sourceBlockId !== block.id || !link.sourceAttrKey) continue;
      const target = byId.get(link.targetBlockId);
      if (!target) continue;
      nextRoot[link.sourceAttrKey] = target.data;
    }
    seeded = nextRoot;
  }
  return resolveReferences(seeded, byId, new Set([block.id]));
};

/**
 * Expand nested JSON into a tree of linked blocks
 */
export const expandNestedJsonIntoLinkedBlocks = (
  currentState: BoardState,
  title: string,
  data: JsonValue,
  nextBlockPosition: (count: number) => { x: number; y: number },
): BoardState | null => {
  if (!isCompositeValue(data)) return null;

  const now = new Date().toISOString();
  const nextBlocks = { ...currentState.blocks };
  const nextPositions = { ...currentState.positions };
  const nextLinks = { ...currentState.links };

  const rootPosition = nextBlockPosition(Object.keys(currentState.blocks).length);
  let rowCursor = 1;
  const nextPosition = (depth: number) => {
    const position = {
      x: rootPosition.x + depth * 290,
      y: rootPosition.y + rowCursor * 130,
    };
    rowCursor += 1;
    return position;
  };

  const createTree = (value: JsonValue, blockTitle: string, depth: number): string => {
    const id = uuidv4();
    const position = depth === 0 ? rootPosition : nextPosition(depth);

    if (Array.isArray(value)) {
      const normalized: JsonValue[] = [];
      value.forEach((item, index) => {
        if (isCompositeValue(item)) {
          const childId = createTree(item, `${blockTitle}[${index}]`, depth + 1);
          normalized.push({ $ref: childId });
          const linkId = uuidv4();
          nextLinks[linkId] = {
            id: linkId,
            sourceBlockId: id,
            sourceAttrKey: String(index),
            targetBlockId: childId,
            label: `[${index}]`,
          };
          return;
        }
        normalized.push(item);
      });

      nextBlocks[id] = {
        id,
        title: blockTitle,
        data: normalized,
        createdAt: now,
        updatedAt: now,
      };
      nextPositions[id] = position;
      return id;
    }

    const normalized: JsonObject = {};
    for (const [key, nested] of Object.entries(value as JsonObject)) {
      const nextValue = nested as JsonValue;
      if (isCompositeValue(nextValue)) {
        const childId = createTree(nextValue, key, depth + 1);
        normalized[key] = { $ref: childId };
        const linkId = uuidv4();
        nextLinks[linkId] = {
          id: linkId,
          sourceBlockId: id,
          sourceAttrKey: key,
          targetBlockId: childId,
        };
        continue;
      }
      normalized[key] = nextValue;
    }

    nextBlocks[id] = {
      id,
      title: blockTitle,
      data: normalized,
      createdAt: now,
      updatedAt: now,
    };
    nextPositions[id] = position;
    return id;
  };

  const rootId = createTree(data, title, 0);

  return {
    ...currentState,
    blocks: nextBlocks,
    positions: nextPositions,
    links: nextLinks,
    selectedBlockId: rootId,
  };
};
