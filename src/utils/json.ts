import {
  InputData,
  jsonInputForTargetLanguage,
  quicktype,
} from "quicktype-core";
import {
  jsonValueSchema,
  type JsonArray,
  type JsonObject,
  type JsonValue,
} from "../types/model";
import { parse as parseJsonc } from "comment-json";

export interface JsonParseError {
  message: string;
}

export interface JsonSchemaConversionResult {
  schema: JsonValue;
  schemaText: string;
}

export interface TypeScriptTypeConversionResult {
  typeText: string;
}

export interface TypeScriptToJsonSchemaOptions {
  typeName?: string;
}

export const parseJsonText = (
  text: string,
): { value?: JsonValue; error?: JsonParseError } => {
  try {
    // Use comment-json to support // and /* */ comments
    const parsed = parseJsonc(text) as unknown;
    const checked = jsonValueSchema.safeParse(parsed);
    if (!checked.success) {
      return {
        error: {
          message: checked.error.issues[0]?.message ?? "Invalid JSON value.",
        },
      };
    }
    return { value: checked.data };
  } catch (error) {
    return {
      error: {
        message:
          error instanceof Error ? error.message : "Failed to parse JSON.",
      },
    };
  }
};

export const convertJsonToJsonSchema = async (
  value: JsonValue,
  rootName = "Root",
): Promise<JsonSchemaConversionResult> => {
  const schemaInput = jsonInputForTargetLanguage("schema");
  await schemaInput.addSource({
    name: rootName,
    samples: [JSON.stringify(value)],
  });

  const inputData = new InputData();
  inputData.addInput(schemaInput);

  const result = await quicktype({
    inputData,
    lang: "schema",
  });

  const schemaText = result.lines.join("\n");
  const parsed = parseJsonText(schemaText);
  if (!parsed.value) {
    throw new Error(
      parsed.error?.message ?? "Failed to convert JSON to JSON Schema.",
    );
  }

  return {
    schema: parsed.value,
    schemaText,
  };
};

export const convertJsonToTypeScriptType = async (
  value: JsonValue,
  rootName = "Root",
): Promise<TypeScriptTypeConversionResult> => {
  const typeInput = jsonInputForTargetLanguage("typescript");
  await typeInput.addSource({
    name: rootName,
    samples: [JSON.stringify(value)],
  });

  const inputData = new InputData();
  inputData.addInput(typeInput);

  const result = await quicktype({
    inputData,
    lang: "typescript",
    rendererOptions: {
      "just-types": "true",
    },
  });

  return {
    typeText: result.lines.join("\n"),
  };
};

export const convertTypeScriptTypeToJsonSchema = async (
  typeText: string,
  options: TypeScriptToJsonSchemaOptions = {},
): Promise<JsonSchemaConversionResult> => {
  const typeName = options.typeName ?? "Root";
  const random = Math.random().toString(36).slice(2);
  const modulePrefix = "node:";
  const fsModuleName = `${modulePrefix}fs/promises`;
  const pathModuleName = `${modulePrefix}path`;
  const osModuleName = `${modulePrefix}os`;
  const schemaModuleName = "typescript-json-schema";

  let fsPromises: {
    mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
    rm: (path: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>;
    writeFile: (path: string, data: string) => Promise<void>;
  };
  let path: {
    join: (...parts: string[]) => string;
  };
  let os: {
    tmpdir: () => string;
  };

  try {
    fsPromises = (await import(/* @vite-ignore */ fsModuleName)) as {
      mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
      rm: (path: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>;
      writeFile: (path: string, data: string) => Promise<void>;
    };
    path = (await import(/* @vite-ignore */ pathModuleName)) as {
      join: (...parts: string[]) => string;
    };
    os = (await import(/* @vite-ignore */ osModuleName)) as {
      tmpdir: () => string;
    };
  } catch {
    throw new Error(
      "convertTypeScriptTypeToJsonSchema can only run in a Node.js environment.",
    );
  }

  const tjs = (await import(/* @vite-ignore */ schemaModuleName)) as {
    getProgramFromFiles: (
      files: string[],
      compilerOptions?: Record<string, unknown>,
    ) => unknown;
    generateSchema: (
      program: unknown,
      fullTypeName: string,
      args?: Record<string, unknown>,
      onlyIncludeFiles?: string[],
      externalGenerator?: unknown,
    ) => unknown;
  };

  const tmpDir = path.join(os.tmpdir(), `playjson-schema-${Date.now()}-${random}`);
  const typeFile = path.join(tmpDir, "types.ts");
  const hasNamedType = new RegExp(
    `\\b(?:interface|type)\\s+${typeName}\\b`,
  ).test(typeText);
  const sourceText = hasNamedType
    ? typeText
    : `export type ${typeName} = ${typeText};`;

  await fsPromises.mkdir(tmpDir, { recursive: true });

  try {
    await fsPromises.writeFile(typeFile, sourceText);
    const program = tjs.getProgramFromFiles([typeFile], {
      strictNullChecks: true,
    });
    const schema = tjs.generateSchema(program, typeName, {
      required: true,
      noExtraProps: false,
    });

    if (!schema) {
      throw new Error(
        `Failed to generate JSON Schema for type \"${typeName}\".`,
      );
    }

    const schemaText = JSON.stringify(schema, null, 2);
    const parsed = parseJsonText(schemaText);
    if (!parsed.value) {
      throw new Error(
        parsed.error?.message ?? "Failed to parse generated JSON Schema.",
      );
    }

    return {
      schema: parsed.value,
      schemaText,
    };
  } finally {
    await fsPromises.rm(tmpDir, { recursive: true, force: true });
  }
};

export const formatJson = (value: JsonValue): string =>
  JSON.stringify(value, null, 2);

export const summarizeJson = (value: JsonValue): string => {
  if (value === null) return "null";
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === "object") return `Object(${Object.keys(value).length})`;
  return String(value);
};

export const isObject = (value: JsonValue): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isArray = (value: JsonValue): value is JsonArray =>
  Array.isArray(value);

export const primitiveFromInput = (raw: string): JsonValue => {
  const trimmed = raw.trim();
  if (trimmed === "null") return null;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed.length > 0 && !Number.isNaN(Number(trimmed)))
    return Number(trimmed);
  return raw;
};

export const findByPath = (root: JsonValue, path: string[]): JsonValue => {
  let current: JsonValue = root;
  for (const segment of path) {
    if (Array.isArray(current)) {
      current = current[Number(segment)] as JsonValue;
    } else if (isObject(current)) {
      current = current[segment] as JsonValue;
    }
  }
  return current;
};

export const setByPath = (
  root: JsonValue,
  path: string[],
  nextValue: JsonValue,
): JsonValue => {
  if (path.length === 0) return nextValue;

  const [head, ...tail] = path;
  if (Array.isArray(root)) {
    const idx = Number(head);
    const copy = [...root];
    copy[idx] = setByPath(copy[idx] as JsonValue, tail, nextValue);
    return copy;
  }

  if (isObject(root)) {
    const copy: JsonObject = { ...root };
    copy[head] = setByPath(copy[head] as JsonValue, tail, nextValue);
    return copy;
  }

  return root;
};

export const deleteByPath = (root: JsonValue, path: string[]): JsonValue => {
  if (path.length === 0) return root;

  if (path.length === 1) {
    const [last] = path;
    if (Array.isArray(root)) {
      const idx = Number(last);
      return root.filter((_, i) => i !== idx);
    }
    if (isObject(root)) {
      const copy: JsonObject = { ...root };
      delete copy[last];
      return copy;
    }
    return root;
  }

  const parentPath = path.slice(0, -1);
  const last = path[path.length - 1] as string;
  const parent = findByPath(root, parentPath);

  let updatedParent: JsonValue = parent;
  if (Array.isArray(parent)) {
    const idx = Number(last);
    updatedParent = parent.filter((_, i) => i !== idx);
  } else if (isObject(parent)) {
    const copy: JsonObject = { ...parent };
    delete copy[last];
    updatedParent = copy;
  }

  return setByPath(root, parentPath, updatedParent);
};

export const renameObjectKey = (
  root: JsonValue,
  pathToObject: string[],
  fromKey: string,
  toKey: string,
): { value?: JsonValue; error?: string } => {
  const parent = findByPath(root, pathToObject);
  if (!isObject(parent)) {
    return { error: "Parent is not an object." };
  }

  if (fromKey === toKey) {
    return { value: root };
  }

  if (toKey in parent) {
    return { error: `Key "${toKey}" already exists.` };
  }

  const updated: JsonObject = {};
  for (const [key, value] of Object.entries(parent)) {
    updated[key === fromKey ? toKey : key] = value;
  }

  return { value: setByPath(root, pathToObject, updated) };
};

export const addObjectKey = (
  root: JsonValue,
  pathToObject: string[],
  key: string,
  value: JsonValue,
): { value?: JsonValue; error?: string } => {
  const parent = findByPath(root, pathToObject);
  if (!isObject(parent)) {
    return { error: "Parent is not an object." };
  }
  if (key in parent) {
    return { error: `Key "${key}" already exists.` };
  }
  const updated: JsonObject = { ...parent, [key]: value };
  return { value: setByPath(root, pathToObject, updated) };
};

export const appendArrayItem = (
  root: JsonValue,
  pathToArray: string[],
  value: JsonValue,
): { value?: JsonValue; error?: string } => {
  const parent = findByPath(root, pathToArray);
  if (!Array.isArray(parent)) {
    return { error: "Parent is not an array." };
  }

  return { value: setByPath(root, pathToArray, [...parent, value]) };
};
