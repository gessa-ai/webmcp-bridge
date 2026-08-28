# Security model

The bridge does not grant authority. It registers descriptors already admitted
by the host and invokes a host callback. A secure integration must:

1. authenticate the current page session;
2. authorize the concrete workspace/project/player resource at discovery and
   again at execution;
3. remove trusted coordinates from the model-facing schema and bind them from
   page/session state;
4. preserve host validation, approval, idempotency, rate limits, audit, and
   client-safe egress;
5. use same-origin secure contexts and normal CSRF/origin controls;
6. abort stale registrations on navigation, permission change, or unmount;
7. bound descriptions, inputs, outputs, and registration counts;
8. treat tool descriptions and results as untrusted content.

The standalone reference backend has no external network authority and mutates
only a session-local in-memory counter. It validates bounds, requires an
idempotency token for mutations, emits restrictive response headers, and
serves an allowlisted set of local files. Cross-origin mutations are rejected,
and session/idempotency stores are bounded. It is an integration example, not
an authentication template.

Please report vulnerabilities privately to `security@gessa.ai` rather than
opening an issue containing exploit or credential details.
