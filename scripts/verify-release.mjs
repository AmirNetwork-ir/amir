import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const [worker, metadata] = await Promise.all([
  readFile(new URL("../worker.js", import.meta.url)),
  readFile(new URL("../version.json", import.meta.url), "utf8").then(JSON.parse),
]);

const text = worker.toString("utf8");
const hash = createHash("sha256").update(worker).digest("hex");

if (!metadata || typeof metadata !== "object") {
  throw new Error("version.json is invalid");
}

if (!metadata.version || typeof metadata.version !== "string") {
  throw new Error("version.json is missing a valid version");
}

if (metadata.protected !== true) {
  throw new Error("version.json does not mark this artifact as protected");
}

if (worker.byteLength < 100_000 || worker.byteLength > 2_900_000) {
  throw new Error(
    `worker.js has an invalid size: ${worker.byteLength} bytes`
  );
}

if (text.includes("sourceMappingURL=")) {
  throw new Error("worker.js must not expose a source map");
}

if (metadata.worker_sha256 !== hash) {
  throw new Error(
    `worker.js SHA-256 mismatch: expected ${metadata.worker_sha256}, got ${hash}`
  );
}

console.log(
  JSON.stringify(
    {
      version: metadata.version,
      bytes: worker.byteLength,
      sha256: hash
    },
    null,
    2
  )
);
