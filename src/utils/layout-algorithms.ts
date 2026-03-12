import { stratify, tree, type HierarchyPointNode } from "d3-hierarchy";
import ELK, {
  type ElkExtendedEdge,
  type ElkNode,
} from "elkjs/lib/elk.bundled.js";
import type { BoardState } from "../types/model";
import {
  AUTO_FORMAT_VIRTUAL_ROOT_ID,
  NODE_WIDTH,
  COLUMN_GAP,
  ROW_GAP,
  START_X,
  START_Y,
} from "./workspace-constants";
import { estimateBlockHeight, sortByCurrentPosition } from "./block-utils";

const elk = new ELK();

interface HierarchyDatum {
  id: string;
  parentId: string | null;
}

const buildDepthMap = (
  orderedIds: string[],
  incoming: ReadonlyMap<string, string[]>,
  visibleLinks: BoardState["links"][string][],
  state: BoardState,
): Map<string, number> => {
  const outgoing = new Map<string, string[]>();
  const pendingIncoming = new Map<string, number>();
  const depthById = new Map<string, number>();

  for (const id of orderedIds) {
    outgoing.set(id, []);
    pendingIncoming.set(id, 0);
    depthById.set(id, 0);
  }

  for (const link of visibleLinks) {
    outgoing.get(link.sourceBlockId)?.push(link.targetBlockId);
    pendingIncoming.set(
      link.targetBlockId,
      (pendingIncoming.get(link.targetBlockId) ?? 0) + 1,
    );
  }

  const queue = orderedIds.filter((id) => (pendingIncoming.get(id) ?? 0) === 0);
  let queueIndex = 0;
  while (queueIndex < queue.length) {
    const current = queue[queueIndex];
    queueIndex += 1;
    if (!current) continue;

    const currentDepth = depthById.get(current) ?? 0;
    const targets = [...(outgoing.get(current) ?? [])].sort((a, b) =>
      sortByCurrentPosition(state, a, b),
    );
    for (const target of targets) {
      depthById.set(
        target,
        Math.max(depthById.get(target) ?? 0, currentDepth + 1),
      );

      const remainingIncoming = (pendingIncoming.get(target) ?? 0) - 1;
      pendingIncoming.set(target, remainingIncoming);
      if (remainingIncoming === 0) {
        queue.push(target);
      }
    }
  }

  if (queue.length === orderedIds.length) {
    return depthById;
  }

  let fallbackDepth = Math.max(0, ...depthById.values());
  for (const id of orderedIds) {
    if ((pendingIncoming.get(id) ?? 0) <= 0) continue;

    const parentDepth = Math.max(
      -1,
      ...(incoming.get(id) ?? []).map(
        (parentId) => depthById.get(parentId) ?? 0,
      ),
    );
    const nextDepth = Math.max(parentDepth + 1, fallbackDepth + 1);
    depthById.set(id, nextDepth);
    fallbackDepth = nextDepth;
  }

  return depthById;
};

/**
 * Format positions of blocks with D3-derived ordering and ELK layered placement.
 */
export const formatPositionsLeftToRight = async (
  state: BoardState,
  targetBlockIds?: ReadonlySet<string>,
): Promise<Record<string, { x: number; y: number }>> => {
  const ids = targetBlockIds
    ? [...targetBlockIds].filter((id) => Boolean(state.blocks[id]))
    : Object.keys(state.blocks);
  if (ids.length === 0) return {};

  const incoming = new Map<string, string[]>();
  for (const id of ids) {
    incoming.set(id, []);
  }
  const active = new Set(ids);
  const visibleLinks = Object.values(state.links).filter(
    (link) => active.has(link.sourceBlockId) && active.has(link.targetBlockId),
  );
  for (const link of visibleLinks) {
    incoming.get(link.targetBlockId)?.push(link.sourceBlockId);
  }

  const orderedIds = [...ids].sort((a, b) =>
    sortByCurrentPosition(state, a, b),
  );
  const depthById = buildDepthMap(orderedIds, incoming, visibleLinks, state);

  let virtualRootId = AUTO_FORMAT_VIRTUAL_ROOT_ID;
  let suffix = 1;
  while (active.has(virtualRootId)) {
    virtualRootId = `${AUTO_FORMAT_VIRTUAL_ROOT_ID}_${suffix}`;
    suffix += 1;
  }

  const hierarchyRows: HierarchyDatum[] = [
    { id: virtualRootId, parentId: null },
  ];
  for (const id of orderedIds) {
    const parents = [...(incoming.get(id) ?? [])].sort((a, b) =>
      sortByCurrentPosition(state, a, b),
    );
    const depth = depthById.get(id) ?? 0;
    const parentId =
      parents.find(
        (parentCandidate) =>
          (depthById.get(parentCandidate) ?? Number.MAX_SAFE_INTEGER) < depth,
      ) ?? virtualRootId;
    hierarchyRows.push({ id, parentId });
  }

  let hierarchyNodes: HierarchyPointNode<HierarchyDatum>[] = [];
  try {
    const root = stratify<HierarchyDatum>()
      .id((datum) => datum.id)
      .parentId((datum) => datum.parentId)(hierarchyRows);
    hierarchyNodes = tree<HierarchyDatum>()
      .nodeSize([1, 1])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.25))(root)
      .descendants()
      .filter((node) => node.data.id !== virtualRootId);
  } catch {
    hierarchyNodes = [];
  }

  const d3VerticalOrder = new Map<string, number>();
  if (hierarchyNodes.length > 0) {
    for (const node of hierarchyNodes) {
      d3VerticalOrder.set(node.data.id, node.x);
    }
  }
  for (const [index, id] of orderedIds.entries()) {
    if (!d3VerticalOrder.has(id)) {
      d3VerticalOrder.set(id, index);
    }
  }

  const d3Columns = new Map<number, string[]>();
  for (const id of orderedIds) {
    const depth = depthById.get(id) ?? 0;
    const list = d3Columns.get(depth) ?? [];
    list.push(id);
    d3Columns.set(depth, list);
  }

  const d3Positions: Record<string, { x: number; y: number }> = {};
  for (const depth of [...d3Columns.keys()].sort((a, b) => a - b)) {
    const columnIds = (d3Columns.get(depth) ?? []).sort((a, b) => {
      const orderDelta =
        (d3VerticalOrder.get(a) ?? 0) - (d3VerticalOrder.get(b) ?? 0);
      if (orderDelta !== 0) return orderDelta;
      return sortByCurrentPosition(state, a, b);
    });

    let yCursor = START_Y;
    for (const id of columnIds) {
      const block = state.blocks[id];
      if (!block) continue;
      d3Positions[id] = {
        x: START_X + depth * (NODE_WIDTH + COLUMN_GAP),
        y: yCursor,
      };
      yCursor += estimateBlockHeight(block.data) + ROW_GAP;
    }
  }

  const elkGraph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": String(ROW_GAP + 20),
      "elk.layered.spacing.nodeNodeBetweenLayers": String(COLUMN_GAP + 80),
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.layered.considerModelOrder.longEdgeStrategy": "DUMMY_NODE_OVER",
      "elk.layered.considerModelOrder.crossingCounterNodeInfluence": "0.2",
      "elk.layered.considerModelOrder.crossingCounterPortInfluence": "0.2",
      "elk.layered.thoroughness": "10",
    },
    children: orderedIds.map((id) => {
      const block = state.blocks[id];
      const d3Position = d3Positions[id] ?? {
        x: START_X + (depthById.get(id) ?? 0) * (NODE_WIDTH + COLUMN_GAP),
        y: START_Y,
      };
      return {
        id,
        width: NODE_WIDTH,
        height: estimateBlockHeight(block.data),
        x: d3Position.x,
        y: d3Position.y,
      };
    }),
    edges: visibleLinks.map(
      (link) =>
        ({
          id: link.id,
          sources: [link.sourceBlockId],
          targets: [link.targetBlockId],
        }) satisfies ElkExtendedEdge,
    ),
  };

  let elkPositions = new Map<string, { x: number; y: number }>();
  try {
    const elkResult = await elk.layout(elkGraph);
    elkPositions = new Map(
      (elkResult.children ?? [])
        .filter(
          (child): child is Required<Pick<ElkNode, "id" | "x" | "y">> =>
            typeof child.id === "string" &&
            typeof child.x === "number" &&
            typeof child.y === "number",
        )
        .map((child) => [child.id, { x: child.x, y: child.y }]),
    );
  } catch {
    elkPositions = new Map();
  }

  if (elkPositions.size > 0) {
    const minX = Math.min(...[...elkPositions.values()].map((pos) => pos.x));
    const minY = Math.min(...[...elkPositions.values()].map((pos) => pos.y));
    const nextPositions: Record<string, { x: number; y: number }> = {};
    for (const id of orderedIds) {
      const position = elkPositions.get(id);
      if (!position) continue;
      nextPositions[id] = {
        x: Math.round(position.x - minX + START_X),
        y: Math.round(position.y - minY + START_Y),
      };
    }
    return nextPositions;
  }

  const fallbackPositions: Record<string, { x: number; y: number }> = {};
  const nodesByDepth = new Map<number, string[]>();
  for (const id of orderedIds) {
    const depth = depthById.get(id) ?? 0;
    const list = nodesByDepth.get(depth) ?? [];
    list.push(id);
    nodesByDepth.set(depth, list);
  }

  for (const depth of [...nodesByDepth.keys()].sort((a, b) => a - b)) {
    const columnIds = (nodesByDepth.get(depth) ?? []).sort((a, b) =>
      sortByCurrentPosition(state, a, b),
    );
    let yCursor = START_Y;
    for (const id of columnIds) {
      const block = state.blocks[id];
      if (!block) continue;
      fallbackPositions[id] = {
        x: START_X + depth * (NODE_WIDTH + COLUMN_GAP),
        y: Math.round(yCursor),
      };
      yCursor += estimateBlockHeight(block.data) + ROW_GAP;
    }
  }

  return fallbackPositions;
};
