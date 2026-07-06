import fs from "node:fs/promises";
import path from "node:path";
import { loadLocalConfig, saveLocalConfig } from "./local-config.mjs";
import { getDataDir, ensureDir } from "./xdg.mjs";

const KAIROS_DIR = path.join(getDataDir(), "kairos");
const SNAPSHOT_FILE = path.join(KAIROS_DIR, "latest.json");

function getCount(field) {
  if (!field) return 0;
  if (Array.isArray(field)) return field.length;
  if (typeof field === "object") return Object.keys(field).length;
  if (typeof field === "string" && field.trim().length > 0) return 1;
  return 0;
}

export function getCounts(snapshot) {
  if (!snapshot) return { identidade: 0, sedimentos: 0, reunioes: 0, mensagens: 0 };
  const ident = snapshot.identidade;
  const sed = snapshot.sedimentos;
  const re = snapshot.reunioes || snapshot.reunioes_recentes || snapshot.meetings;
  const msg = snapshot.mensagens || snapshot.mensagens_recentes || snapshot.messages;

  return {
    identidade: getCount(ident),
    sedimentos: getCount(sed),
    reunioes: getCount(re),
    mensagens: getCount(msg),
  };
}

export function renderContext(snapshot) {
  if (!snapshot) return "";

  const lines = [
    "=== TÚNEL DE KAIRÓS / CONTEXTO IMPORTADO DA TOTALIDADE ===",
    "Este bloco é contexto importado da Totalidade. Use como contexto operacional, não como memória final nem como confirmação absoluta.",
    "",
  ];

  if (snapshot.identidade) {
    lines.push("## Identidade Kaline");
    if (typeof snapshot.identidade === "string") {
      lines.push(snapshot.identidade);
    } else {
      lines.push(JSON.stringify(snapshot.identidade, null, 2));
    }
    lines.push("");
  }

  const sedimentos = snapshot.sedimentos || [];
  if (Array.isArray(sedimentos) && sedimentos.length > 0) {
    lines.push("## Sedimentos de Memória Recentes");
    sedimentos.forEach((s) => {
      if (typeof s === "string") {
        lines.push(`- ${s}`);
      } else if (s && typeof s === "object") {
        const text = s.conteudo || s.text || s.content || JSON.stringify(s);
        lines.push(`- ${text}`);
      }
    });
    lines.push("");
  }

  const reunioes = snapshot.reunioes || snapshot.reunioes_recentes || snapshot.meetings || [];
  if (Array.isArray(reunioes) && reunioes.length > 0) {
    lines.push("## Reuniões/Alinhamentos Recentes");
    reunioes.forEach((r) => {
      if (typeof r === "string") {
        lines.push(`- ${r}`);
      } else if (r && typeof r === "object") {
        const title = r.titulo || r.title || "";
        const summary = r.resumo || r.summary || "";
        lines.push(`- ${title}: ${summary}`);
      }
    });
    lines.push("");
  }

  const mensagens = snapshot.mensagens || snapshot.mensagens_recentes || snapshot.messages || [];
  if (Array.isArray(mensagens) && mensagens.length > 0) {
    lines.push("## Mensagens da Faceta Kaline");
    mensagens.slice(-20).forEach((m) => {
      if (typeof m === "string") {
        lines.push(`- ${m}`);
      } else if (m && typeof m === "object") {
        const sender = m.autor || m.sender || m.role || "Kaline";
        const content = m.conteudo || m.text || m.content || "";
        lines.push(`- [${sender}]: ${content}`);
      }
    });
    lines.push("");
  }

  const fullText = lines.join("\n");
  const maxChars = 15000;
  if (fullText.length > maxChars) {
    return fullText.slice(0, maxChars) + "\n\n...(conteúdo truncado por limite de tamanho)...";
  }
  return fullText;
}

export async function getSharedKey() {
  const config = await loadLocalConfig();
  return config?.kairos?.sharedKey || null;
}

export async function saveSharedKey(sharedKey) {
  const config = (await loadLocalConfig()) || {};
  if (!config.kairos) {
    config.kairos = {};
  }
  config.kairos.sharedKey = sharedKey;
  await saveLocalConfig(config);
}

export function normalizeKairosPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (payload.snapshot && typeof payload.snapshot === "object") {
    const normalized = { ...payload.snapshot };

    if (payload.schema_version !== undefined) normalized.schema_version = payload.schema_version;
    if (payload.snapshot_id !== undefined) normalized.snapshot_id = payload.snapshot_id;
    if (payload.generated_at !== undefined) normalized.generated_at = payload.generated_at;
    if (payload.source !== undefined) normalized.source = payload.source;
    if (payload.scope !== undefined) normalized.scope = payload.scope;
    if (payload.excludes !== undefined) normalized.excludes = payload.excludes;
    if (payload.counts !== undefined) normalized.metadata_counts = payload.counts;

    return normalized;
  }

  return payload;
}

export async function loadSnapshot() {
  try {
    const data = await fs.readFile(SNAPSHOT_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveSnapshot(payload) {
  await ensureDir(KAIROS_DIR);
  const normalized = normalizeKairosPayload(payload);
  const data = {
    ...normalized,
    importedAt: new Date().toISOString(),
  };
  await fs.writeFile(SNAPSHOT_FILE, JSON.stringify(data, null, 2), "utf-8");
  return data;
}

export async function getKairosStatus() {
  const key = await getSharedKey();
  const snapshot = await loadSnapshot();

  return {
    ok: true,
    configured: Boolean(key),
    hasSnapshot: Boolean(snapshot),
    lastImportedAt: snapshot?.importedAt || null,
    counts: getCounts(snapshot),
  };
}

export const summarizeKairosSnapshot = getCounts;
export const renderKairosContextBlock = renderContext;
