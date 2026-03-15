import type { BoardState } from "../types/model";
import { formatPositionsLeftToRight } from "./layout-algorithms";
import type {
  LayoutWorkerRequest,
  LayoutWorkerResponse,
} from "../workers/layout-worker-types";

interface PendingRequest {
  resolve: (positions: Record<string, { x: number; y: number }>) => void;
  reject: (error: Error) => void;
}

const pendingRequests = new Map<string, PendingRequest>();
let workerInstance: Worker | null = null;
let requestCount = 0;

const rejectAllPendingRequests = (error: Error) => {
  for (const pending of pendingRequests.values()) {
    pending.reject(error);
  }
  pendingRequests.clear();
};

const handleWorkerMessage = (event: MessageEvent<LayoutWorkerResponse>) => {
  const response = event.data;
  const pending = pendingRequests.get(response.requestId);
  if (!pending) return;

  pendingRequests.delete(response.requestId);
  if ("error" in response) {
    pending.reject(new Error(response.error));
    return;
  }

  pending.resolve(response.positions);
};

const handleWorkerError = () => {
  rejectAllPendingRequests(
    new Error("Layout worker crashed while calculating positions."),
  );

  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
};

const getWorker = (): Worker | null => {
  if (typeof Worker === "undefined") return null;

  if (!workerInstance) {
    workerInstance = new Worker(new URL("../workers/layout.worker.ts", import.meta.url), {
      type: "module",
    });
    workerInstance.onmessage = handleWorkerMessage;
    workerInstance.onerror = handleWorkerError;
    workerInstance.onmessageerror = handleWorkerError;
  }

  return workerInstance;
};

const requestLayoutFromWorker = (
  worker: Worker,
  state: BoardState,
  targetBlockIds?: ReadonlySet<string>,
  arrayVisibleCount?: ReadonlyMap<string, number>,
): Promise<Record<string, { x: number; y: number }>> => {
  const requestId = `layout-${Date.now()}-${requestCount}`;
  requestCount += 1;

  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });

    const message: LayoutWorkerRequest = {
      requestId,
      state,
      targetBlockIds: targetBlockIds ? [...targetBlockIds] : undefined,
      arrayVisibleCount: arrayVisibleCount
        ? Object.fromEntries(arrayVisibleCount)
        : undefined,
    };

    try {
      worker.postMessage(message);
    } catch (error) {
      pendingRequests.delete(requestId);
      reject(
        error instanceof Error
          ? error
          : new Error("Unable to send layout request to worker."),
      );
    }
  });
};

export const formatPositionsLeftToRightInWorker = async (
  state: BoardState,
  targetBlockIds?: ReadonlySet<string>,
  arrayVisibleCount?: ReadonlyMap<string, number>,
): Promise<Record<string, { x: number; y: number }>> => {
  const worker = getWorker();
  if (!worker) {
    return formatPositionsLeftToRight(state, targetBlockIds, arrayVisibleCount);
  }

  try {
    return await requestLayoutFromWorker(worker, state, targetBlockIds, arrayVisibleCount);
  } catch {
    return formatPositionsLeftToRight(state, targetBlockIds, arrayVisibleCount);
  }
};
