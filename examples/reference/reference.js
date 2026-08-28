import { WebMcpRegistrationController } from "../../dist/index.js";

const status = document.querySelector("#status");
const counterOutput = document.querySelector("#counter");
let stateMode = "backend";
let localCounter = readStoredCounter();

async function request(path, init) {
  const response = await fetch(path, init);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? `request failed (${response.status})`);
  if (typeof result.counter === "number") {
    localCounter = result.counter;
    counterOutput.textContent = String(result.counter);
  }
  return result;
}

async function readCounter(signal) {
  if (stateMode === "backend") {
    try {
      return await request("/api/state", { signal });
    } catch (error) {
      if (signal?.aborted) throw error;
      stateMode = "page-local";
    }
  }
  counterOutput.textContent = String(localCounter);
  return { ok: true, counter: localCounter, stateMode };
}

async function incrementCounter(amount, signal) {
  if (stateMode === "backend") {
    try {
      return await request("/api/increment", {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          "x-reference-invocation-id": crypto.randomUUID()
        },
        body: JSON.stringify({ amount })
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      stateMode = "page-local";
    }
  }
  localCounter += amount;
  writeStoredCounter(localCounter);
  counterOutput.textContent = String(localCounter);
  return { ok: true, counter: localCounter, applied: amount, stateMode };
}

const descriptors = [
  {
    name: "reference_read_counter",
    title: "Read counter",
    description: "Read the current counter shown on this page.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    boundArguments: [],
    surfaceIds: ["workbench"]
  },
  {
    name: "reference_increment_counter",
    title: "Increment counter",
    description: "Increment the visible page counter by a bounded amount.",
    inputSchema: {
      type: "object",
      properties: { amount: { type: "integer", minimum: 1, maximum: 10 } },
      required: ["amount"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false },
    boundArguments: [],
    surfaceIds: ["workbench"]
  }
];

const registrations = WebMcpRegistrationController.forDocument(document, {
  invoke: ({ descriptor, input, signal }) => {
    if (descriptor.name === "reference_read_counter") return readCounter(signal);
    const amount = Number(input.amount);
    if (!Number.isInteger(amount) || amount < 1 || amount > 10) {
      return { ok: false, error: "amount must be an integer from 1 through 10" };
    }
    return incrementCounter(amount, signal);
  }
});

await readCounter();
const report = await registrations.reconcile(descriptors, "reference-page-v1");
status.textContent = report.status === "ready"
  ? `${report.activeCount} tools ready · ${stateMode === "backend" ? "same-origin host" : "page-local demo"}`
  : "WebMCP unavailable; the page still works normally";
status.dataset.status = report.status;

document.querySelector("#manual-increment").addEventListener("click", async () => {
  try {
    await incrementCounter(1);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "manual increment failed";
  }
});

document.querySelector("#dispose").addEventListener("click", () => {
  registrations.dispose();
  status.textContent = "tools unregistered";
  status.dataset.status = "unsupported";
});

function readStoredCounter() {
  try {
    const value = Number.parseInt(sessionStorage.getItem("gessa_webmcp_reference_counter") ?? "0", 10);
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeStoredCounter(value) {
  try {
    sessionStorage.setItem("gessa_webmcp_reference_counter", String(value));
  } catch {
    // Storage may be unavailable in privacy-restricted browser contexts.
  }
}
