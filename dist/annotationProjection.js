/** Project only annotations currently supported by the WebMCP imperative API. */
export function projectWebMcpAnnotations(annotations) {
    if (!annotations)
        return {};
    return {
        ...(typeof annotations.readOnlyHint === "boolean"
            ? { readOnlyHint: annotations.readOnlyHint }
            : {}),
        ...(typeof annotations.untrustedContentHint === "boolean"
            ? { untrustedContentHint: annotations.untrustedContentHint }
            : {})
    };
}
//# sourceMappingURL=annotationProjection.js.map