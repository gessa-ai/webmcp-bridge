# Architecture

`@gessa/webmcp-bridge` is deliberately an adapter, not an action runtime.

```text
authorized host registry
  -> host filters principal + page surface
  -> bridge projects trusted-bound JSON schema
  -> registration controller calls document.modelContext.registerTool
  -> browser agent executes one page-scoped tool
  -> host invoker repeats authorization and calls its canonical action owner
  -> bridge bounds/serializes the result
  -> navigation aborts stale registrations
```

## Modules

- `contracts.ts`: portable manifest, descriptor, invocation, page-context, and
  browser interfaces.
- `buildIdentity.ts`: version and deterministic logic-source identity surfaced
  by the production manifest.
- `schemaProjection.ts`: removes host-trusted arguments such as project and
  idempotency coordinates from model-facing JSON Schema.
- `annotationProjection.ts`: emits only currently supported WebMCP annotations.
- `surfacePolicy.ts`: deterministic contextual surface classification helpers.
- `registrationController.ts`: literal imperative registration, stable
  reconciliation, cancellation forwarding, and abort-owned teardown.
- `resultProjection.ts`: JSON serialization and byte bounds.

The package has no React, engine, renderer, graph, database, authentication, or
network dependency. Those concerns remain owned by the integrating host.

The reference backend under `examples/reference/` is deliberately toy host
code, not a bridge dependency. It demonstrates a same-origin invoker with
server-bound session state, validation, idempotency, and a manual control that
shares the WebMCP action path.

## Gessa integration

Gessa projects every canonical action owner through this package, but registers
only the signed-in principal's current page subset. The live creator page binds
workspace, project, route, document, and selection coordinates. A published
game uses the same controller for a separate opt-in surface derived from its
authored input declarations and public runtime projection.

The two surfaces never mix: creator actions are server-owned and authenticated;
published-game actions are player-local declarations that flow into the normal
runtime input dispatcher.
