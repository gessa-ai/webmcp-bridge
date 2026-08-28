import type { WebMcpAnnotations } from "./contracts.js";
/** Project only annotations currently supported by the WebMCP imperative API. */
export declare function projectWebMcpAnnotations(annotations: Readonly<Record<string, unknown>> | undefined): WebMcpAnnotations;
