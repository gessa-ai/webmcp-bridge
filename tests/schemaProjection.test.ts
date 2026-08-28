import { describe, expect, it } from "vitest";
import {
  bindTrustedPageCoordinates,
  projectWebMcpAnnotations,
  projectWebMcpInputSchema
} from "../src/index.js";

describe("WebMCP schema projection", () => {
  it("removes trusted coordinates without mutating owner truth", () => {
    const owner = {
      type: "object",
      properties: {
        game_id: { type: "string" },
        workspace_id: { type: "string" },
        name: { type: "string" }
      },
      required: ["game_id", "workspace_id", "name"],
      additionalProperties: false
    };

    const projected = projectWebMcpInputSchema(owner, ["game_id", "workspace_id"]);

    expect(projected).toEqual({
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
      additionalProperties: false
    });
    expect(owner.required).toEqual(["game_id", "workspace_id", "name"]);
    expect(owner.properties.game_id).toEqual({ type: "string" });
  });

  it("overwrites injected model coordinates with trusted page values", () => {
    expect(bindTrustedPageCoordinates(
      { game_id: "attacker-project", name: "Moon gate" },
      ["game_id"],
      { projectId: "current-project" }
    )).toEqual({ game_id: "current-project", name: "Moon gate" });
  });

  it("fails closed when a required trusted coordinate is absent", () => {
    expect(() => bindTrustedPageCoordinates({}, ["game_id"], {}))
      .toThrow("missing trusted coordinate for game_id");
  });

  it("projects only annotations supported by WebMCP", () => {
    expect(projectWebMcpAnnotations({
      readOnlyHint: true,
      destructiveHint: false,
      untrustedContentHint: true
    })).toEqual({ readOnlyHint: true, untrustedContentHint: true });
  });
});
