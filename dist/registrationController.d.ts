import type { JsonObject, WebMcpDocumentLike, WebMcpModelContext, WebMcpToolDescriptor } from "./contracts.js";
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
/** Own one Document's imperative WebMCP registrations. */
export declare class WebMcpRegistrationController {
    private readonly modelContext;
    private readonly invoke;
    private readonly resultMaxBytes;
    private readonly active;
    private disposed;
    constructor(options: WebMcpRegistrationControllerOptions);
    static forDocument(documentLike: WebMcpDocumentLike | undefined, options: Omit<WebMcpRegistrationControllerOptions, "modelContext">): WebMcpRegistrationController;
    get supported(): boolean;
    get activeNames(): string[];
    reconcile(descriptors: readonly WebMcpToolDescriptor[], contextKey: string): Promise<WebMcpRegistrationReport>;
    dispose(): void;
}
