import type {
  JsonObject,
  JsonValue,
  WebMcpDocumentLike,
  WebMcpModelContext,
  WebMcpToolDescriptor
} from "./contracts.js";
import { serializableWebMcpResult } from "./resultProjection.js";

export interface WebMcpToolInvocation {
  descriptor: WebMcpToolDescriptor;
  input: JsonObject;
  contextKey: string;
  signal: AbortSignal;
}

export type WebMcpToolInvoker = (input: WebMcpToolInvocation) => Promise<unknown> | unknown;

export interface WebMcpRegistrationFailure {
  name: string;
  message: string;
}

export interface WebMcpRegistrationReport {
  status: "ready" | "unsupported" | "disposed";
  registered: string[];
  removed: string[];
  unchanged: string[];
  failures: WebMcpRegistrationFailure[];
  activeCount: number;
}

export interface WebMcpRegistrationControllerOptions {
  modelContext?: WebMcpModelContext;
  invoke: WebMcpToolInvoker;
  resultMaxBytes?: number;
}

interface ActiveRegistration {
  controller: AbortController;
  fingerprint: string;
}

/** Own one Document's imperative WebMCP registrations. */
export class WebMcpRegistrationController {
  private readonly modelContext: WebMcpModelContext | undefined;
  private readonly invoke: WebMcpToolInvoker;
  private readonly resultMaxBytes: number | undefined;
  private readonly active = new Map<string, ActiveRegistration>();
  private disposed = false;

  constructor(options: WebMcpRegistrationControllerOptions) {
    this.modelContext = options.modelContext;
    this.invoke = options.invoke;
    this.resultMaxBytes = options.resultMaxBytes;
  }

  static forDocument(
    documentLike: WebMcpDocumentLike | undefined,
    options: Omit<WebMcpRegistrationControllerOptions, "modelContext">
  ): WebMcpRegistrationController {
    return new WebMcpRegistrationController({
      ...options,
      modelContext: documentLike?.modelContext
    });
  }

  get supported(): boolean {
    return typeof this.modelContext?.registerTool === "function";
  }

  get activeNames(): string[] {
    return [...this.active.keys()].sort();
  }

  async reconcile(
    descriptors: readonly WebMcpToolDescriptor[],
    contextKey: string
  ): Promise<WebMcpRegistrationReport> {
    if (this.disposed) return emptyReport("disposed", this.active.size);
    if (!this.supported || !this.modelContext) return emptyReport("unsupported", 0);

    const desired = new Map<string, { descriptor: WebMcpToolDescriptor; fingerprint: string }>();
    for (const descriptor of [...descriptors].sort((left, right) => left.name.localeCompare(right.name))) {
      if (desired.has(descriptor.name)) {
        throw new Error(`Duplicate WebMCP tool descriptor: ${descriptor.name}`);
      }
      desired.set(descriptor.name, {
        descriptor,
        fingerprint: stableJson({ contextKey, descriptor })
      });
    }

    const removed: string[] = [];
    const unchanged: string[] = [];
    for (const [name, registration] of this.active) {
      const next = desired.get(name);
      if (next?.fingerprint === registration.fingerprint) {
        unchanged.push(name);
        desired.delete(name);
        continue;
      }
      registration.controller.abort();
      this.active.delete(name);
      removed.push(name);
    }

    const registered: string[] = [];
    const failures: WebMcpRegistrationFailure[] = [];
    for (const { descriptor, fingerprint } of desired.values()) {
      const controller = new AbortController();
      try {
        await this.modelContext.registerTool({
          name: descriptor.name,
          title: descriptor.title,
          description: descriptor.description,
          inputSchema: descriptor.inputSchema,
          annotations: descriptor.annotations,
          execute: async (input, execution) => {
            const result = await this.invoke({
              descriptor,
              input,
              contextKey,
              signal: execution.signal
            });
            return serializableWebMcpResult(result, this.resultMaxBytes);
          }
        }, { signal: controller.signal });
        this.active.set(descriptor.name, { controller, fingerprint });
        registered.push(descriptor.name);
      } catch (error) {
        controller.abort();
        failures.push({
          name: descriptor.name,
          message: error instanceof Error ? error.message : "WebMCP tool registration failed"
        });
      }
    }

    return {
      status: "ready",
      registered,
      removed,
      unchanged: unchanged.sort(),
      failures,
      activeCount: this.active.size
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const registration of this.active.values()) registration.controller.abort();
    this.active.clear();
  }
}

function emptyReport(
  status: "unsupported" | "disposed",
  activeCount: number
): WebMcpRegistrationReport {
  return {
    status,
    registered: [],
    removed: [],
    unchanged: [],
    failures: [],
    activeCount
  };
}

function stableJson(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortJson(entry)])
  );
}
