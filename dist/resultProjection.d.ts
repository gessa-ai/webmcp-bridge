import type { JsonValue } from "./contracts.js";
export declare const DEFAULT_WEBMCP_RESULT_MAX_BYTES: number;
/**
 * Enforce the WebMCP requirement that execution results are JSON serializable
 * and keep a caller-controlled byte ceiling. Redaction remains the owner's job.
 */
export declare function serializableWebMcpResult(value: unknown, maxBytes?: number): JsonValue;
