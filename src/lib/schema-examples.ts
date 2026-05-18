import type { JsonObject, JsonSchema, JsonValue } from "./types";

export function exampleFromSchema(schema: JsonSchema | undefined): JsonValue {
  if (!schema || Object.keys(schema).length === 0) {
    return {};
  }

  if (schema.const !== undefined) {
    return schema.const;
  }
  if (schema.default !== undefined) {
    return schema.default;
  }
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }
  if (schema.oneOf && schema.oneOf.length > 0) {
    return exampleFromSchema(schema.oneOf[0]);
  }
  if (schema.anyOf && schema.anyOf.length > 0) {
    return exampleFromSchema(schema.anyOf[0]);
  }
  if (schema.allOf && schema.allOf.length > 0) {
    return mergeAllOfExamples(schema.allOf);
  }

  const type = firstType(schema);
  switch (type) {
    case "string":
      return stringExample(schema.format);
    case "integer":
      return 1;
    case "number":
      return 1.23;
    case "boolean":
      return true;
    case "array":
      return [exampleFromSchema(schema.items)];
    case "object":
      return objectExample(schema);
    case "null":
      return null;
    default:
      return {};
  }
}

export function toolCallExample(toolName: string, inputSchema: JsonSchema | undefined): JsonObject {
  return {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: toolName,
      arguments: exampleFromSchema(inputSchema),
    },
  };
}

function firstType(schema: JsonSchema): string | undefined {
  if (Array.isArray(schema.type)) {
    return schema.type.find((type) => type !== "null") ?? schema.type[0];
  }
  if (schema.type) {
    return schema.type;
  }
  if (schema.properties || schema.additionalProperties) {
    return "object";
  }
  if (schema.items) {
    return "array";
  }
  return undefined;
}

function objectExample(schema: JsonSchema): JsonObject {
  const properties = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const entries = Object.entries(properties).sort(([left], [right]) => {
    const leftRequired = required.has(left);
    const rightRequired = required.has(right);
    if (leftRequired === rightRequired) {
      return left.localeCompare(right);
    }
    return leftRequired ? -1 : 1;
  });

  if (entries.length === 0 && typeof schema.additionalProperties === "object") {
    return { property: exampleFromSchema(schema.additionalProperties) };
  }

  return Object.fromEntries(
    entries.map(([key, value]) => [key, exampleFromSchema(value)]),
  ) as JsonObject;
}

function mergeAllOfExamples(schemas: JsonSchema[]): JsonValue {
  const values = schemas.map((schema) => exampleFromSchema(schema));
  if (values.every(isJsonObject)) {
    return Object.assign({}, ...values);
  }
  return values[0] ?? {};
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringExample(format: string | undefined): string {
  switch (format) {
    case "email":
      return "user@example.com";
    case "uri":
    case "url":
      return "https://example.com";
    case "date":
      return "2026-05-15";
    case "date-time":
      return "2026-05-15T12:00:00.000Z";
    case "uuid":
      return "00000000-0000-4000-8000-000000000000";
    default:
      return "string";
  }
}
