# @gessa/webmcp-bridge

Framework-neutral contracts and browser lifecycle code for projecting an
existing, authorized tool registry into the experimental WebMCP imperative API.

It solves the adapter problem between a mature application and page-scoped
agent tools: preserve the application's existing action owners and security,
remove page-trusted coordinates from model input, register only the current
surface, and retire stale tools on navigation.

The package does not implement Gessa engine actions. It accepts already
filtered tool descriptors, registers them on the current document, forwards
executions to a caller-supplied invoker, and unregisters tools with the
standard abort-signal lifecycle.

```ts
const registrations = new WebMcpRegistrationController({
  modelContext: document.modelContext,
  invoke: ({ descriptor, input, contextKey, signal }) =>
    api.invoke(descriptor.name, { input, contextKey }, signal),
});

await registrations.reconcile(manifest.tools, manifest.contextKey);

// Route change or application teardown:
registrations.dispose();
```

The package is a progressive enhancement. When `document.modelContext` is not
available, reconciliation reports `unsupported` and the host application keeps
working normally.

The exported `WEBMCP_BRIDGE_IDENTITY` is also returned by the Gessa production
manifest. `npm run verify:identity` derives its SHA-256 value from every bridge
logic source file (excluding only the identity declaration), so a public/live
source mismatch fails verification instead of relying on a version label.

## What is public—and what is not

This repository/package is the complete MIT-licensed bridge submitted for the
WebMCP Challenge. It contains the exact registration, schema projection,
lifecycle, result-boundary, tests, and standalone reference app used by Gessa.

Gessa Cloud is a proprietary service that consumes the bridge. Its game engine,
renderer, persistence, action implementations, and deployment system are not
part of this package. The bridge does not simulate those systems and the
reference app does not require them. See [HACKATHON.md](./HACKATHON.md) for the
submission boundary and [ARCHITECTURE.md](./ARCHITECTURE.md) for the integration
contract.

## Reference page

Install, verify, then run the reference server from this package:

```sh
npm install
npm run verify
npm run reference
```

Open <http://127.0.0.1:4173/examples/reference/> in a WebMCP-enabled browser,
or use the static reference at <https://gessa-ai.github.io/webmcp-bridge/>.
The page registers two tools, shows live registration state, and lets the
browser's Site tools inspector execute them. A tiny same-origin Node backend
provides session-local state, validation, and idempotency. The visible manual
button uses the same endpoint, so the page remains useful without WebMCP.

The GitHub Pages reference uses session-local state because Pages is static.
The local Node reference additionally exercises same-origin validation,
idempotency, and session isolation. Both use the published bridge code and the
same visible tool lifecycle; neither simulates Gessa engine actions.

## Verify

```sh
npm install
npm run verify
```

Expected behavior:

- 20 focused tests pass;
- the reference backend smoke check proves validation and exact-once mutation;
- the TypeScript package builds without engine dependencies;
- the reference module parses;
- an unsupported browser displays an honest fallback;
- a WebMCP-enabled browser lists `reference_read_counter` and
  `reference_increment_counter`, and increment visibly changes the page.

## Host integration invariants

- Filter authorization and surface relevance before passing descriptors here.
- Bind workspace/project/session coordinates outside model-controlled input.
- Repeat authorization at execution time; discovery is not authority.
- Forward the execution signal to the host request.
- Treat tool output as untrusted and keep it JSON-serializable and bounded.
- Call `dispose()` or reconcile a replacement context on navigation.

Machine-readable claim and eval maps are in
[`evidence/judge-index.json`](./evidence/judge-index.json) and
[`evidence/eval-definitions.json`](./evidence/eval-definitions.json).
