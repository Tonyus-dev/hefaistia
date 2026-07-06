import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

const home = os.homedir();

export function getConfigDir() {
  const base = process.env.XDG_CONFIG_HOME || path.join(home, ".config");
  return path.join(base, "klio-hefaistia");
}

export function getDataDir() {
  const base = process.env.XDG_DATA_HOME || path.join(home, ".local", "share");
  return path.join(base, "klio-hefaistia");
}

export function getStateDir() {
  const base = process.env.XDG_STATE_HOME || path.join(home, ".local", "state");
  return path.join(base, "klio-hefaistia");
}

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
  return dir;
}
