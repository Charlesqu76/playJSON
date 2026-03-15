import type { BoardState } from "../types/model";

export interface LayoutWorkerRequest {
  requestId: string;
  state: BoardState;
  targetBlockIds?: string[];
  arrayVisibleCount?: Record<string, number>;
}

export interface LayoutWorkerSuccessResponse {
  requestId: string;
  positions: Record<string, { x: number; y: number }>;
}

export interface LayoutWorkerErrorResponse {
  requestId: string;
  error: string;
}

export type LayoutWorkerResponse =
  | LayoutWorkerSuccessResponse
  | LayoutWorkerErrorResponse;
