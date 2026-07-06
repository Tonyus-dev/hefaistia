// Cria a pasta de uma nova sessão de trabalho, só por ação explícita do
// usuário (botão "Nova sessão" no console). Nunca escreve fora de sessions/,
// nunca aceita path vindo do cliente — só um título opcional que é
// sanitizado aqui. Cria só uma pasta + metadata.json; nunca sobrescreve,
// nunca apaga, nunca lê/lista conteúdo de outro lugar do disco.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getDataDir } from "./xdg.mjs";

const SESSIONS_DIR = path.join(getDataDir(), "sessions");

function slugify(title) {
  return String(title ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

async function pathExists(candidate) {
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}

export async function createSession({ title } = {}) {
  await fs.mkdir(SESSIONS_DIR, { recursive: true });

  const trimmedTitle = typeof title === "string" ? title.trim().slice(0, 120) : "";
  const slug = slugify(trimmedTitle) || "sessao";
  const dateStamp = todayStamp();

  let folderName = `${dateStamp}-${slug}`;
  let dirPath = path.join(SESSIONS_DIR, folderName);
  let suffix = 2;
  while (await pathExists(dirPath)) {
    folderName = `${dateStamp}-${slug}-${suffix}`;
    dirPath = path.join(SESSIONS_DIR, folderName);
    suffix += 1;
  }

  await fs.mkdir(dirPath);

  const metadata = {
    title: trimmedTitle || null,
    created_at: new Date().toISOString(),
    folder: folderName,
  };
  await fs.writeFile(
    path.join(dirPath, "metadata.json"),
    JSON.stringify(metadata, null, 2),
    "utf-8",
  );

  return { folder: folderName, path: `sessions/${folderName}`, metadata };
}

export async function getSessionsStatus() {
  try {
    await fs.mkdir(SESSIONS_DIR, { recursive: true });
    const entries = await fs.readdir(SESSIONS_DIR, { withFileTypes: true });
    const count = entries.filter((e) => e.isDirectory()).length;
    return { ok: true, sessionsDir: SESSIONS_DIR, count };
  } catch (err) {
    return { ok: false, sessionsDir: SESSIONS_DIR, count: 0, error: err.message };
  }
}
