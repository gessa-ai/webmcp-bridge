import { describe, expect, it } from "vitest";
import { serializableWebMcpResult } from "../src/index.js";

describe("serializableWebMcpResult", () => {
  it("normalizes undefined and clones serializable results", () => {
    expect(serializableWebMcpResult(undefined)).toBeNull();
    expect(serializableWebMcpResult({ ok: true, nested: [1, 2] }))
      .toEqual({ ok: true, nested: [1, 2] });
  });

  it("enforces a bounded result size", () => {
    expect(() => serializableWebMcpResult({ value: "too-large" }, 4))
      .toThrow("exceeds 4 bytes");
  });
});
