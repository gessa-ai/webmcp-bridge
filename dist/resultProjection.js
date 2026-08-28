export const DEFAULT_WEBMCP_RESULT_MAX_BYTES = 256 * 1024;
/**
 * Enforce the WebMCP requirement that execution results are JSON serializable
 * and keep a caller-controlled byte ceiling. Redaction remains the owner's job.
 */
export function serializableWebMcpResult(value, maxBytes = DEFAULT_WEBMCP_RESULT_MAX_BYTES) {
    const normalized = value === undefined ? null : value;
    const serialized = JSON.stringify(normalized);
    if (serialized === undefined) {
        throw new TypeError("WebMCP tool result is not JSON serializable");
    }
    const byteLength = new TextEncoder().encode(serialized).byteLength;
    if (byteLength > maxBytes) {
        throw new RangeError(`WebMCP tool result exceeds ${maxBytes} bytes`);
    }
    return JSON.parse(serialized);
}
//# sourceMappingURL=resultProjection.js.map