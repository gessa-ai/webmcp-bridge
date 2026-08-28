import type { JsonObject, WebMcpBoundArgument } from "./contracts.js";
export interface TrustedPageCoordinates {
    workspaceId?: string;
    projectId?: string;
    invocationId?: string;
}
/**
 * Return a model-facing copy of an owner JSON schema with trusted top-level
 * coordinates removed. The owner schema remains untouched and authoritative.
 */
export declare function projectWebMcpInputSchema(ownerSchema: Readonly<Record<string, unknown>>, boundArguments: readonly WebMcpBoundArgument[]): JsonObject;
/**
 * Bind server-validated page coordinates after model input. Any same-named
 * model value is overwritten, never trusted.
 */
export declare function bindTrustedPageCoordinates(modelInput: Readonly<Record<string, unknown>>, boundArguments: readonly WebMcpBoundArgument[], coordinates: TrustedPageCoordinates): JsonObject;
