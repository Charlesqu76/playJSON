/// <reference lib="webworker" />

import { formatPositionsLeftToRight } from "../utils/layout-algorithms";
import type {
  LayoutWorkerRequest,
  LayoutWorkerResponse,
} from "./layout-worker-types";

const scope = self as DedicatedWorkerGlobalScope;

scope.onmessage = async (event: MessageEvent<LayoutWorkerRequest>) => {
  const { requestId, state, targetBlockIds, arrayVisibleCount } = event.data;

  try {
    const positions = await formatPositionsLeftToRight(
      state,
      targetBlockIds ? new Set(targetBlockIds) : undefined,
      arrayVisibleCount ? new Map(Object.entries(arrayVisibleCount)) : undefined,
    );

    const response: LayoutWorkerResponse = {
      requestId,
      positions,
    };
    scope.postMessage(response);
  } catch (error) {
    const response: LayoutWorkerResponse = {
      requestId,
      error:
        error instanceof Error
          ? error.message
          : "Unable to compute node positions in worker.",
    };
    scope.postMessage(response);
  }
};

export {};
