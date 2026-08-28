import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";

const sourceDirectory = new URL("../src/", import.meta.url);
const identityUrl = new URL("../src/buildIdentity.ts", import.meta.url);
const packageUrl = new URL("../package.json", import.meta.url);
const names = (await readdir(sourceDirectory))
  .filter((name) => name.endsWith(".ts") && name !== "buildIdentity.ts")
  .sort();

const hash = createHash("sha256");
for (const name of names) {
  hash.update(name);
  hash.update("\0");
  hash.update(await readFile(new URL(name, sourceDirectory)));
  hash.update("\0");
}
const expectedHash = hash.digest("hex");
const identitySource = await readFile(identityUrl, "utf8");
const packageJson = JSON.parse(await readFile(packageUrl, "utf8"));
const declaredHash = identitySource.match(/sourceHash:\s*"([^"]+)"/)?.[1];
const declaredVersion = identitySource.match(/version:\s*"([^"]+)"/)?.[1];

if (declaredHash !== expectedHash) {
  throw new Error(`bridge source hash drift: expected ${expectedHash}, found ${declaredHash ?? "missing"}`);
}
if (declaredVersion !== packageJson.version) {
  throw new Error(`bridge version drift: package=${packageJson.version}, identity=${declaredVersion ?? "missing"}`);
}

process.stdout.write(`bridge identity verified: ${packageJson.version} ${expectedHash}\n`);
