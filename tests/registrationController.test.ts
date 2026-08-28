import { describe, expect, it, vi } from "vitest";
import {
  WebMcpRegistrationController,
  type JsonObject,
  type WebMcpImperativeTool,
  type WebMcpRegisterToolOptions,
  type WebMcpToolDescriptor
} from "../src/index.js";

function descriptor(name: string, description = name): WebMcpToolDescriptor {
  return {
    name,
    title: name,
    description,
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    boundArguments: [],
    surfaceIds: ["workbench"]
  };
}

class FakeModelContext {
  readonly tools = new Map<string, WebMcpImperativeTool>();

  async registerTool(tool: WebMcpImperativeTool, options?: WebMcpRegisterToolOptions): Promise<void> {
    if (this.tools.has(tool.name)) throw new Error(`duplicate ${tool.name}`);
    this.tools.set(tool.name, tool);
    options?.signal?.addEventListener("abort", () => this.tools.delete(tool.name), { once: true });
  }
}

describe("WebMcpRegistrationController", () => {
  it("is a no-op progressive enhancement when WebMCP is unavailable", async () => {
    const controller = new WebMcpRegistrationController({ invoke: vi.fn() });
    await expect(controller.reconcile([descriptor("a")], "context-a"))
      .resolves.toMatchObject({ status: "unsupported", activeCount: 0 });
  });

  it("registers deterministically and preserves unchanged registrations", async () => {
    const context = new FakeModelContext();
    const controller = new WebMcpRegistrationController({ modelContext: context, invoke: vi.fn() });

    const first = await controller.reconcile([descriptor("z"), descriptor("a")], "context-a");
    expect(first.registered).toEqual(["a", "z"]);
    expect([...context.tools.keys()]).toEqual(["a", "z"]);

    const second = await controller.reconcile([descriptor("a"), descriptor("z")], "context-a");
    expect(second.unchanged).toEqual(["a", "z"]);
    expect(second.registered).toEqual([]);
  });

  it("aborts stale tools and registers changed replacements", async () => {
    const context = new FakeModelContext();
    const controller = new WebMcpRegistrationController({ modelContext: context, invoke: vi.fn() });
    await controller.reconcile([descriptor("a"), descriptor("b")], "context-a");

    const report = await controller.reconcile([descriptor("a", "changed")], "context-b");

    expect(report.removed).toEqual(["a", "b"]);
    expect(report.registered).toEqual(["a"]);
    expect([...context.tools.keys()]).toEqual(["a"]);
  });

  it("forwards execution input, context key, and cancellation signal", async () => {
    const context = new FakeModelContext();
    const invoke = vi.fn(async () => ({ ok: true, revision: 2 }));
    const controller = new WebMcpRegistrationController({ modelContext: context, invoke });
    await controller.reconcile([descriptor("inspect")], "context-7");
    const signal = new AbortController().signal;

    const result = await context.tools.get("inspect")!.execute({ target: "moon" } as JsonObject, { signal });

    expect(result).toEqual({ ok: true, revision: 2 });
    expect(invoke).toHaveBeenCalledWith(expect.objectContaining({
      input: { target: "moon" },
      contextKey: "context-7",
      signal
    }));
  });

  it("disposes every active registration", async () => {
    const context = new FakeModelContext();
    const controller = new WebMcpRegistrationController({ modelContext: context, invoke: vi.fn() });
    await controller.reconcile([descriptor("a"), descriptor("b")], "context-a");
    controller.dispose();

    expect(context.tools.size).toBe(0);
    await expect(controller.reconcile([descriptor("c")], "context-c"))
      .resolves.toMatchObject({ status: "disposed", activeCount: 0 });
  });
});
