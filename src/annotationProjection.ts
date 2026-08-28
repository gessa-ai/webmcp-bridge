import type { WebMcpAnnotations } from "./contracts.js";

/** Project only annotations currently supported by the WebMCP imperative API. */
export function projectWebMcpAnnotations(
  annotations: Readonly<Record<string, unknown>> | undefined
): WebMcpAnnotations {
  if (!annotations) return {};
  return {
    ...(typeof annotations.readOnlyHint === "boolean"
      ? { readOnlyHint: annotations.readOnlyHint }
      : {}),
    ...(typeof annotations.untrustedContentHint === "boolean"
      ? { untrustedContentHint: annotations.untrustedContentHint }
      : {})
  };
}
