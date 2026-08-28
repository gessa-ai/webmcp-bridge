import { serializableWebMcpResult } from "./resultProjection.js";
/** Own one Document's imperative WebMCP registrations. */
export class WebMcpRegistrationController {
    modelContext;
    invoke;
    resultMaxBytes;
    active = new Map();
    disposed = false;
    constructor(options) {
        this.modelContext = options.modelContext;
        this.invoke = options.invoke;
        this.resultMaxBytes = options.resultMaxBytes;
    }
    static forDocument(documentLike, options) {
        return new WebMcpRegistrationController({
            ...options,
            modelContext: documentLike?.modelContext
        });
    }
    get supported() {
        return typeof this.modelContext?.registerTool === "function";
    }
    get activeNames() {
        return [...this.active.keys()].sort();
    }
    async reconcile(descriptors, contextKey) {
        if (this.disposed)
            return emptyReport("disposed", this.active.size);
        if (!this.supported || !this.modelContext)
            return emptyReport("unsupported", 0);
        const desired = new Map();
        for (const descriptor of [...descriptors].sort((left, right) => left.name.localeCompare(right.name))) {
            if (desired.has(descriptor.name)) {
                throw new Error(`Duplicate WebMCP tool descriptor: ${descriptor.name}`);
            }
            desired.set(descriptor.name, {
                descriptor,
                fingerprint: stableJson({ contextKey, descriptor })
            });
        }
        const removed = [];
        const unchanged = [];
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
        const registered = [];
        const failures = [];
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
            }
            catch (error) {
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
    dispose() {
        if (this.disposed)
            return;
        this.disposed = true;
        for (const registration of this.active.values())
            registration.controller.abort();
        this.active.clear();
    }
}
function emptyReport(status, activeCount) {
    return {
        status,
        registered: [],
        removed: [],
        unchanged: [],
        failures: [],
        activeCount
    };
}
function stableJson(value) {
    return JSON.stringify(sortJson(value));
}
function sortJson(value) {
    if (Array.isArray(value))
        return value.map(sortJson);
    if (!value || typeof value !== "object")
        return value;
    return Object.fromEntries(Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, sortJson(entry)]));
}
//# sourceMappingURL=registrationController.js.map