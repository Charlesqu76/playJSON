import { z } from 'zod';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

export interface JsonBlock {
  id: string;
  title: string;
  data: JsonValue;
  createdAt: string;
  updatedAt: string;
}

export interface BlockPosition {
  x: number;
  y: number;
}

export interface BlockLink {
  id: string;
  sourceBlockId: string;
  targetBlockId: string;
  sourceAttrKey?: string;
  label?: string;
}

export interface BoardState {
  blocks: Record<string, JsonBlock>;
  positions: Record<string, BlockPosition>;
  links: Record<string, BlockLink>;
  selectedBlockId: string | null;
  searchQuery: string;
  version: 1;
}

const jsonSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(jsonSchema),
  ]),
);

const jsonBlockSchema: z.ZodType<JsonBlock> = z.object({
  id: z.string().min(1),
  title: z.string(),
  data: jsonSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

const blockPositionSchema: z.ZodType<BlockPosition> = z.object({
  x: z.number(),
  y: z.number(),
});

const blockLinkSchema: z.ZodType<BlockLink> = z.object({
  id: z.string().min(1),
  sourceBlockId: z.string().min(1),
  targetBlockId: z.string().min(1),
  sourceAttrKey: z.string().optional(),
  label: z.string().optional(),
});

export const boardStateSchema: z.ZodType<BoardState> = z.object({
  blocks: z.record(jsonBlockSchema),
  positions: z.record(blockPositionSchema),
  links: z.record(blockLinkSchema),
  selectedBlockId: z.string().nullable(),
  searchQuery: z.string(),
  version: z.literal(1),
});

export const jsonValueSchema = jsonSchema;
