import assert from "node:assert/strict";
import { once } from "node:events";
import { createReferenceServer } from "./server.mjs";

const server = createReferenceServer();
server.listen(0, "127.0.0.1");
await once(server, "listening");

try {
  const address = server.address();
  assert(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;

  const firstState = await fetch(`${origin}/api/state`);
  assert.equal(firstState.status, 200);
  const setCookie = firstState.headers.get("set-cookie");
  assert(setCookie);
  const cookie = setCookie.split(";", 1)[0];
  assert.deepEqual(await firstState.json(), { ok: true, counter: 0 });

  const increment = await postIncrement(origin, cookie, "smoke_invocation_0001", 3);
  assert.equal(increment.status, 200);
  assert.deepEqual(await increment.json(), {
    ok: true,
    counter: 3,
    applied: 3,
    duplicate: false
  });

  const duplicate = await postIncrement(origin, cookie, "smoke_invocation_0001", 3);
  assert.equal(duplicate.status, 200);
  assert.deepEqual(await duplicate.json(), {
    ok: true,
    counter: 3,
    applied: 3,
    duplicate: true
  });

  const rejected = await postIncrement(origin, cookie, "smoke_invocation_0002", 11);
  assert.equal(rejected.status, 400);

  const crossOrigin = await fetch(`${origin}/api/increment`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
      origin: "https://example.invalid",
      "x-reference-invocation-id": "smoke_invocation_0003"
    },
    body: JSON.stringify({ amount: 1 })
  });
  assert.equal(crossOrigin.status, 403);

  const finalState = await fetch(`${origin}/api/state`, { headers: { cookie } });
  assert.deepEqual(await finalState.json(), { ok: true, counter: 3 });

  const page = await fetch(`${origin}/examples/reference/`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Gessa WebMCP Bridge Reference/);

  process.stdout.write("reference smoke: state, validation, idempotency, and static app passed\n");
} finally {
  server.close();
  await once(server, "close");
}

function postIncrement(origin, cookie, invocationId, amount) {
  return fetch(`${origin}/api/increment`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
      "x-reference-invocation-id": invocationId
    },
    body: JSON.stringify({ amount })
  });
}
