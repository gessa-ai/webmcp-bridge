import type { WebMcpSurface } from "./contracts.js";

const PRIVILEGED_VERBS = /(?:^|_)(?:delete|drain|expire|revoke|kick|ban|rollback|steal)(?:_|$)/u;

/**
 * Presentation relevance only. This never grants authorization; the host must
 * filter scopes and resource access independently before registration/call.
 */
export function gessaWebMcpSurfacesForTool(toolName: string): WebMcpSurface[] {
  const name = toolName.toLowerCase();
  const surfaces = new Set<WebMcpSurface>();

  if (name.startsWith("workspace_") || name.startsWith("project_list_games") || name.startsWith("project_list_recent_games") || name.startsWith("project_create_game") || name.startsWith("project_get_game") || name.startsWith("project_update_game") || name.startsWith("project_delete_game")) {
    surfaces.add("projects");
  }
  if (name.startsWith("model_") || name.includes("model_material_slot")) {
    surfaces.add("model");
  }
  if (name.includes("material")) {
    surfaces.add("material");
  }
  if (name.startsWith("script_") || name.includes("script_semantic_patch")) {
    surfaces.add("script");
  }
  if (name.startsWith("warehouse_")) {
    surfaces.add("data");
  }
  if (name.startsWith("runtime_")) {
    surfaces.add("publish");
    surfaces.add("playtest");
  }
  if (name.startsWith("qa_") || name.startsWith("simulation_") || name.startsWith("versioning_") || name.startsWith("agentenv_") || name.includes("observe") || name.includes("playtest") || name.includes("proof")) {
    surfaces.add("playtest");
  }
  if (name.startsWith("generation_") || name.startsWith("asset_library_") || name.startsWith("spatial_") || name.startsWith("world_build_from_spatial")) {
    surfaces.add("workbench");
    surfaces.add("model");
  }
  if (name.startsWith("engine_") || name.startsWith("knowledge_") || name === "lookup_capability" || name.includes("project_convention")) {
    surfaces.add("workbench");
    surfaces.add("script");
  }
  if (name.includes("ui_")) surfaces.add("ui");
  if (name.startsWith("mcp_")) surfaces.add("mcp_management");

  if (name.startsWith("project_") || name.startsWith("world_") || name.startsWith("prefab_") || name.startsWith("asset_") || name.startsWith("terrain_") || name.startsWith("generator_")) {
    surfaces.add("workbench");
  }

  if (PRIVILEGED_VERBS.test(name)) surfaces.add("admin");
  if (surfaces.size === 0) surfaces.add("workbench");
  return [...surfaces].sort();
}
