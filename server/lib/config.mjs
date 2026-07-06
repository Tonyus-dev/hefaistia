// Configuração central do runtime da Klio Hefaístia. Tudo lido de variáveis
// de ambiente, com fallback seguro. Nenhum valor aqui é secreto exceto
// OPENROUTER_API_KEY, que nunca deve ser logado ou devolvido em resposta.

import { getRuntimeToken } from "./local-config.mjs";

export const KLIO_HOST = process.env.KLIO_HOST || "127.0.0.1";
export const KLIO_PORT = Number.parseInt(process.env.KLIO_PORT || "4518", 10);
export const KLIO_TOKEN = await getRuntimeToken();
export const KLIO_ALLOW_LAN = process.env.KLIO_ALLOW_LAN === "1";

export const OLLAMA_URL = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
export const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "qwen2.5-coder:7b";
export const HESTIA_URL = (process.env.HESTIA_URL || "http://127.0.0.1:4517").replace(/\/+$/, "");

// Klio Local (PR 3): modelo pequeno local, dirigido por knowledge/*.md.
export const KLIO_LOCAL_MODEL = process.env.KLIO_LOCAL_MODEL || "qwen2.5:0.5b";

// Kaline Fallback (PR 3): OpenRouter, só quando explicitamente chamado.
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
export const KALINE_FALLBACK_MODEL = process.env.KALINE_FALLBACK_MODEL || "google/gemini-2.5-flash";
export const OPENROUTER_BASE_URL = (
  process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1"
).replace(/\/+$/, "");

export const KALINE_CONTEXT_EXPORT_MAX_ITEMS = Number.parseInt(
  process.env.KALINE_CONTEXT_EXPORT_MAX_ITEMS || "30",
  10,
);

export const MAX_KNOWLEDGE_CHARS = Number.parseInt(process.env.MAX_KNOWLEDGE_CHARS || "24000", 10);

export const MAX_BODY_BYTES = 256 * 1024; // tarefas são texto estruturado, não upload
export const HEALTH_TIMEOUT_MS = 1500;
export const PROXY_TIMEOUT_MS = 5000;
export const INFERENCE_TIMEOUT_MS = 120_000; // hardware legado pode ser lento

// Puxar um modelo é download real de vários GB — precisa de bem mais tempo
// que uma chamada de inferência. Só acontece quando o usuário pede
// explicitamente (POST /api/models/pull); nunca automático.
export const PULL_TIMEOUT_MS = Number.parseInt(
  process.env.KLIO_PULL_TIMEOUT_MS || `${30 * 60 * 1000}`,
  10,
);

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "localhost"]);

// Recusa iniciar fora de loopback sem confirmação explícita. Chamada uma vez
// no boot do servidor (server/hefaistia.mjs), não em cada requisição.
export function enforceLanSafety() {
  if (!LOOPBACK_HOSTS.has(KLIO_HOST) && !KLIO_ALLOW_LAN) {
    console.error(
      `[hefaistia] LAN_DISABLED: KLIO_HOST="${KLIO_HOST}" não é loopback. ` +
        `Defina KLIO_ALLOW_LAN=1 explicitamente para expor a Hefaístia fora de 127.0.0.1.`,
    );
    process.exit(1);
  }
}
