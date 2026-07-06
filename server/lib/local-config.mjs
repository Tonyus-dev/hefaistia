import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { getConfigDir, ensureDir } from "./xdg.mjs";

const CONFIG_FILE = path.join(getConfigDir(), "config.json");

export async function loadLocalConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function ensureLocalConfig() {
  let config = await loadLocalConfig();
  if (config && config.token) {
    return config;
  }

  const token = crypto.randomBytes(32).toString("base64url");
  config = {
    token,
    created_at: new Date().toISOString(),
  };

  const configDir = getConfigDir();
  await ensureDir(configDir);
  try {
    await fs.chmod(configDir, 0o700);
  } catch {}

  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });

  try {
    await fs.chmod(CONFIG_FILE, 0o600);
  } catch {}

  return config;
}

export async function saveLocalConfig(config) {
  const configDir = getConfigDir();
  await ensureDir(configDir);
  try {
    await fs.chmod(configDir, 0o700);
  } catch {}

  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });

  try {
    await fs.chmod(CONFIG_FILE, 0o600);
  } catch {}
}

export async function getRuntimeToken() {
  if (process.env.KLIO_TOKEN) {
    return process.env.KLIO_TOKEN;
  }

  if (process.env.NODE_ENV !== "production") {
    const config = await loadLocalConfig();
    if (config && config.token) {
      return config.token;
    }
    return "dev-local";
  }

  const config = await ensureLocalConfig();
  return config.token;
}
