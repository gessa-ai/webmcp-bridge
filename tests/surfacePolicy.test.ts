import { describe, expect, it } from "vitest";
import { gessaWebMcpSurfacesForTool } from "../src/index.js";

describe("gessaWebMcpSurfacesForTool", () => {
  it.each([
    ["model_add_primitive", "model"],
    ["project_apply_material_semantic_patch", "material"],
    ["script_typecheck", "script"],
    ["warehouse_query_records", "data"],
    ["world_playtest_scenario", "playtest"],
    ["runtime_create_deployment", "publish"],
    ["project_create_entity", "workbench"]
  ] as const)("classifies %s for %s", (toolName, surface) => {
    expect(gessaWebMcpSurfacesForTool(toolName)).toContain(surface);
  });

  it("classifies destructive operations for privileged presentation", () => {
    expect(gessaWebMcpSurfacesForTool("runtime_drain_deployment")).toContain("admin");
  });

  it("fails open only for presentation by assigning an unknown tool to workbench", () => {
    expect(gessaWebMcpSurfacesForTool("future_canonical_tool")).toEqual(["workbench"]);
  });
});
