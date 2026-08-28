import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const MAX_SESSIONS = 256;
const MAX_INVOCATIONS_PER_SESSION = 512;
const staticFiles = new Map([
  ["/examples/reference/", resolve(packageRoot, "examples/reference/index.html")],
  ["/examples/reference/index.html", resolve(packageRoot, "examples/reference/index.html")],
  ["/examples/reference/reference.js", resolve(packageRoot, "examples/reference/reference.js")]
]);

export function createReferenceServer() {
  const sessions = new Map();

  return createServer(async (request, response) => {
    try {
      applySecurityHeaders(response);
      const url = new URL(request.url ?? "/", "http://localhost");

      if (request.method === "GET" && url.pathname === "/") {
        response.writeHead(302, { location: "/examples/reference/" });
        response.end();
        return;
      }

      if (url.pathname === "/api/state" && request.method === "GET") {
        const session = resolveSession(request, response, sessions);
        sendJson(response, 200, { ok: true, counter: session.counter });
        return;
      }

      if (url.pathname === "/api/increment" && request.method === "POST") {
        if (!hasSameOrigin(request)) {
          sendJson(response, 403, { ok: false, error: "cross-origin mutation refused" });
          return;
        }
        if (!String(request.headers["content-type"] ?? "").toLowerCase().startsWith("application/json")) {
          sendJson(response, 415, { ok: false, error: "application/json is required" });
          return;
        }
        const session = resolveSession(request, response, sessions);
        const body = await readJsonBody(request, 8_192);
        const amount = body?.amount;
        const invocationId = request.headers["x-reference-invocation-id"];
        if (!Number.isInteger(amount) || amount < 1 || amount > 10) {
          sendJson(response, 400, {
            ok: false,
            error: "amount must be an integer from 1 through 10"
          });
          return;
        }
        if (typeof invocationId !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(invocationId)) {
          sendJson(response, 400, { ok: false, error: "a valid invocation id is required" });
          return;
        }
        const prior = session.invocations.get(invocationId);
        if (prior) {
          sendJson(response, 200, { ...prior, duplicate: true });
          return;
        }
        session.counter += amount;
        const result = { ok: true, counter: session.counter, applied: amount, duplicate: false };
        if (session.invocations.size >= MAX_INVOCATIONS_PER_SESSION) {
          session.invocations.delete(session.invocations.keys().next().value);
        }
        session.invocations.set(invocationId, result);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === "GET") {
        const file = staticFileFor(url.pathname);
        if (file) {
          const body = await readFile(file);
          response.writeHead(200, {
            "content-type": contentType(file),
            "content-length": body.byteLength,
            "cache-control": "no-store"
          });
          response.end(body);
          return;
        }
      }

      sendJson(response, 404, { ok: false, error: "not found" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "request failed";
      sendJson(response, message === "request body too large" ? 413 : 400, {
        ok: false,
        error: message
      });
    }
  });
}

function resolveSession(request, response, sessions) {
  const cookies = parseCookies(request.headers.cookie);
  const suppliedId = cookies.get("gessa_reference_session");
  const sessionId = suppliedId && /^[a-f0-9-]{36}$/.test(suppliedId)
    ? suppliedId
    : randomUUID();
  let session = sessions.get(sessionId);
  if (!session) {
    if (sessions.size >= MAX_SESSIONS) sessions.delete(sessions.keys().next().value);
    session = { counter: 0, invocations: new Map() };
    sessions.set(sessionId, session);
  }
  if (sessionId !== suppliedId) {
    response.setHeader(
      "set-cookie",
      `gessa_reference_session=${sessionId}; Path=/; HttpOnly; SameSite=Strict`
    );
  }
  return session;
}

function hasSameOrigin(request) {
  const origin = request.headers.origin;
  if (typeof origin !== "string") return true;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

function parseCookies(header) {
  const cookies = new Map();
  for (const entry of String(header ?? "").split(";")) {
    const separator = entry.indexOf("=");
    if (separator <= 0) continue;
    cookies.set(entry.slice(0, separator).trim(), entry.slice(separator + 1).trim());
  }
  return cookies;
}

async function readJsonBody(request, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.byteLength;
    if (size > maxBytes) throw new Error("request body too large");
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function staticFileFor(pathname) {
  const exact = staticFiles.get(pathname);
  if (exact) return exact;
  if (!pathname.startsWith("/dist/") || extname(pathname) !== ".js") return undefined;
  const candidate = resolve(packageRoot, `.${pathname}`);
  const distRoot = resolve(packageRoot, "dist");
  return candidate.startsWith(`${distRoot}${sep}`) ? candidate : undefined;
}

function contentType(file) {
  return extname(file) === ".html"
    ? "text/html; charset=utf-8"
    : "text/javascript; charset=utf-8";
}

function applySecurityHeaders(response) {
  response.setHeader("content-security-policy", "default-src 'self'; script-src 'self'; connect-src 'self'; style-src 'unsafe-inline'");
  response.setHeader("referrer-policy", "no-referrer");
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("cache-control", "no-store");
}

function sendJson(response, status, body) {
  const encoded = Buffer.from(JSON.stringify(body));
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": encoded.byteLength
  });
  response.end(encoded);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const requestedPort = Number.parseInt(process.env.GESSA_REFERENCE_PORT ?? "4173", 10);
  const port = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 4173;
  createReferenceServer().listen(port, "127.0.0.1", () => {
    process.stdout.write(`Gessa WebMCP reference: http://127.0.0.1:${port}/examples/reference/\n`);
  });
}
