import type {
  JsonObject,
  JsonValue,
  WebMcpBoundArgument
} from "./contracts.js";

const BINDING_BY_ARGUMENT: Readonly<Record<WebMcpBoundArgument, "workspaceId" | "projectId" | "invocationId">> = {
  workspace_id: "workspaceId",
  game_id: "projectId",
  idempotency_key: "invocationId"
};

export interface TrustedPageCoordinates {
  workspaceId?: string;
  projectId?: string;
  invocationId?: string;
}

/**
 * Return a model-facing copy of an owner JSON schema with trusted top-level
 * coordinates removed. The owner schema remains untouched and authoritative.
 */
export function projectWebMcpInputSchema(
  ownerSchema: Readonly<Record<string, unknown>>,
  boundArguments: readonly WebMcpBoundArgument[]
): JsonObject {
  const projected = cloneJsonObject(ownerSchema);
  if (boundArguments.length === 0) return projected;

  const properties = jsonObject(projected.properties);
  if (properties) {
    for (const argument of boundArguments) delete properties[argument];
  }

  if (Array.isArray(projected.required)) {
    const bound = new Set<string>(boundArguments);
    const required = projected.required.filter(
      (value): value is JsonValue => typeof value === "string" && !bound.has(value)
    );
    if (required.length > 0) projected.required = required;
    else delete projected.required;
  }

  return projected;
}

/**
 * Bind server-validated page coordinates after model input. Any same-named
 * model value is overwritten, never trusted.
 */
export function bindTrustedPageCoordinates(
  modelInput: Readonly<Record<string, unknown>>,
  boundArguments: readonly WebMcpBoundArgument[],
  coordinates: TrustedPageCoordinates
): JsonObject {
  const output = cloneJsonObject(modelInput);
  for (const argument of boundArguments) {
    const coordinate = coordinates[BINDING_BY_ARGUMENT[argument]];
    if (!coordinate) {
      throw new Error(`WebMCP page context is missing trusted coordinate for ${argument}`);
    }
    output[argument] = coordinate;
  }
  return output;
}

function cloneJsonObject(value: Readonly<Record<string, unknown>>): JsonObject {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new TypeError("WebMCP JSON object is not serializable");
  const parsed: unknown = JSON.parse(serialized);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new TypeError("WebMCP JSON object must be a plain object");
  }
  return parsed as JsonObject;
}

function jsonObject(value: JsonValue | undefined): JsonObject | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject
    : undefined;
}
