# WebMCP Challenge submission boundary

## Submitted project

The submitted open-source project is `@gessa/webmcp-bridge`: the complete,
functional bridge between an existing authorized tool registry and WebMCP's
imperative page API. The code, tests, reference page, license, architecture,
security model, and evidence snapshot in this package are intended for the
public challenge repository.

Development for the challenge began on August 26, 2026. Gessa existed before
the event; this WebMCP bridge and the integrations described here are new event
work.

## Proprietary service disclosure

The live demonstration also uses Gessa Cloud, a proprietary game-creation and
publishing service. Its pre-existing engine, renderer, graph, persistence,
generation, and deployment implementations are external dependencies, not
submitted source. The bridge remains fully runnable without them through the
reference page.

## Demonstrated product

Gessa uses the exact bridge package for two linked experiences:

1. a signed-in creator page exposes authorized, contextual projections of its
   214 canonical action owners so an agent can author, inspect, playtest,
   repair, and publish a real game alongside a human;
2. an opted-in published game exposes tools derived from the creator's authored
   input actions plus an explicit public-state projection, so an agent can play
   and verify the result.

The claim is projection coverage, not simultaneous anonymous authority. The
page registers only the relevant authorized subset and repeats resource checks
on every call.

## Judge path

1. Open <https://gessa-ai.github.io/webmcp-bridge/> for the static live
   reference. Run `npm run verify`, then `npm run reference`, for the local
   same-origin reference that additionally proves validation, session
   isolation, and idempotency.
2. Use Site tools to read and increment the visible counter; use the manual
   button to see the same backend state change without WebMCP.
3. Inspect `registrationController.ts` for the literal `registerTool` call and
   abort-signal teardown.
4. Inspect `evidence/judge-index.json` for the claim-to-source map.
5. Inspect `evidence/gessa-coverage-snapshot.json` for the dated Gessa
   integration coverage claim.
6. Use the live Gessa demonstration credentials/instructions supplied in the
   Devpost submission to run the creator-to-published-game proof.
