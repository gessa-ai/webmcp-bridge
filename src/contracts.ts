export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;
export interface JsonObject {
  [key: string]: JsonValue;
}

export const WEBMCP_SURFACES = [
  "projects",
  "workbench",
  "model",
  "material",
  "script",
  "ui",
  "data",
  "playtest",
  "publish",
  "mcp_management",
  "admin",
  "player"
] as const;

export type WebMcpSurface = (typeof WEBMCP_SURFACES)[number];
export type WebMcpBoundArgument = "workspace_id" | "game_id" | "idempotency_key";

export interface WebMcpAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

export interface WebMcpActiveDocument {
  kind: string;
  id?: string;
  instanceId?: string;
  label?: string;
}

export interface WebMcpPageContext {
  schemaVersion: "gessa.webmcp.page-context.v1";
  surface: WebMcpSurface;
  routeId: string;
  pathname: string;
  workspaceId?: string;
  projectId?: string;
  activeDocument?: WebMcpActiveDocument;
  selection?: {
    entityIds?: string[];
    resourceKind?: string;
    resourceId?: string;
  };
  viewport?: {
    worldId?: string;
    mode?: string;
  };
  runtime?: {
    deploymentId?: string;
    sessionId?: string;
    readiness?: string;
  };
  revision: number;
}

export interface WebMcpToolDescriptor {
  name: string;
  title: string;
  description: string;
  inputSchema: JsonObject;
  annotations: WebMcpAnnotations;
  boundArguments: WebMcpBoundArgument[];
  surfaceIds: WebMcpSurface[];
}

export interface WebMcpManifest {
  schemaVersion: "gessa.webmcp.manifest.v1";
  bridge: WebMcpBridgeIdentity;
  catalogHash: string;
  contextKey: string;
  canonicalToolCount: number;
  projectedToolCount: number;
  eligibleToolCount: number;
  registeredToolCount: number;
  tools: WebMcpToolDescriptor[];
}

export interface WebMcpBridgeIdentity {
  name: "@gessa/webmcp-bridge";
  version: string;
  sourceHash: string;
}

export interface WebMcpInvokeRequest {
  schemaVersion: "gessa.webmcp.invoke.v1";
  invocationId: string;
  contextKey: string;
  pageContext: WebMcpPageContext;
  arguments: JsonObject;
}

export interface WebMcpInvokeResult {
  schemaVersion: "gessa.webmcp.result.v1";
  invocationId: string;
  toolName: string;
  ok: boolean;
  result?: JsonValue;
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
}

export interface WebMcpExecutionOptions {
  signal: AbortSignal;
}

export interface WebMcpImperativeTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: JsonObject;
  annotations?: WebMcpAnnotations;
  execute: (input: JsonObject, options: WebMcpExecutionOptions) => Promise<JsonValue> | JsonValue;
}

export interface WebMcpRegisterToolOptions {
  signal?: AbortSignal;
  exposedTo?: string[];
}

export interface WebMcpModelContext {
  registerTool(tool: WebMcpImperativeTool, options?: WebMcpRegisterToolOptions): Promise<void>;
}

export interface WebMcpDocumentLike {
  readonly modelContext?: WebMcpModelContext;
}
