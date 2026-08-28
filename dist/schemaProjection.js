const BINDING_BY_ARGUMENT = {
    workspace_id: "workspaceId",
    game_id: "projectId",
    idempotency_key: "invocationId"
};
/**
 * Return a model-facing copy of an owner JSON schema with trusted top-level
 * coordinates removed. The owner schema remains untouched and authoritative.
 */
export function projectWebMcpInputSchema(ownerSchema, boundArguments) {
    const projected = cloneJsonObject(ownerSchema);
    if (boundArguments.length === 0)
        return projected;
    const properties = jsonObject(projected.properties);
    if (properties) {
        for (const argument of boundArguments)
            delete properties[argument];
    }
    if (Array.isArray(projected.required)) {
        const bound = new Set(boundArguments);
        const required = projected.required.filter((value) => typeof value === "string" && !bound.has(value));
        if (required.length > 0)
            projected.required = required;
        else
            delete projected.required;
    }
    return projected;
}
/**
 * Bind server-validated page coordinates after model input. Any same-named
 * model value is overwritten, never trusted.
 */
export function bindTrustedPageCoordinates(modelInput, boundArguments, coordinates) {
    const output = cloneJsonObject(modelInput);
    for (const argument of boundArguments) {
        const coordinate = coordinates[BINDING_BY_ARGUMENT[argument]];
        if (!coordinate) {
            throw new Error(`WebMCP page context is missing trusted coordinate for ${argument}`);
        }
        output[argument] = coordinate;
    }
    return output;
}
function cloneJsonObject(value) {
    const serialized = JSON.stringify(value);
    if (serialized === undefined)
        throw new TypeError("WebMCP JSON object is not serializable");
    const parsed = JSON.parse(serialized);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new TypeError("WebMCP JSON object must be a plain object");
    }
    return parsed;
}
function jsonObject(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : undefined;
}
//# sourceMappingURL=schemaProjection.js.map