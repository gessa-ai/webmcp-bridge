import type { WebMcpSurface } from "./contracts.js";
/**
 * Presentation relevance only. This never grants authorization; the host must
 * filter scopes and resource access independently before registration/call.
 */
export declare function gessaWebMcpSurfacesForTool(toolName: string): WebMcpSurface[];
