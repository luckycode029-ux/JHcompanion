import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

let loaded = false;

function parseEnvLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const separator = trimmed.indexOf("=");
  if (separator === -1) return null;

  const key = trimmed.slice(0, separator).trim();
  let value = trimmed.slice(separator + 1).trim();

  if (!key) return null;

  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.endsWith(quote)) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

export function loadServerEnv() {
  if (loaded) return;
  loaded = true;

  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  const contents = readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed || process.env[parsed.key]) continue;
    process.env[parsed.key] = parsed.value;
  }
}
