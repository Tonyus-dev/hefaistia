// Constantes locais da Klio Hefaístia, usadas hoje pela home informativa
// (PR 1) e pela futura UI da forja (PR 4+). O runtime real em
// server/hefaistia.mjs e server/lib/config.mjs (PR 2/PR 3) lê os próprios
// valores via variáveis de ambiente — estas constantes espelham os mesmos
// defaults para exibição.

export const KLIO_HEFAISTIA_HOST = "127.0.0.1";
export const KLIO_HEFAISTIA_PORT = 4518;

export const OLLAMA_URL = "http://127.0.0.1:11434";

// Héstia é um projeto separado e opcional. A Hefaístia pode futuramente
// consultá-la para telemetria, mas nunca depende dela para funcionar.
export const HESTIA_URL = "http://127.0.0.1:4517";

// Modelo usado quando a tarefa/benchmark não informa `model`/`model_hint`.
export const DEFAULT_MODEL = "qwen2.5-coder:7b";

// Klio Local (PR 3): modelo pequeno local, dirigido por knowledge/*.md.
export const KLIO_LOCAL_MODEL = "qwen2.5:0.5b";

// Kaline Fallback (PR 3): OpenRouter, só quando explicitamente chamado.
// A chave de API nunca vive no frontend — isto é só o nome do modelo padrão,
// exibido como referência.
export const KALINE_FALLBACK_MODEL = "google/gemini-2.5-flash";

// --- PR 4: Console Visual da Forja ------------------------------------------

// URL padrão do runtime consumido pelo console. Configurável pelo usuário na
// SettingsPanel e persistida em localStorage — isto é só o default inicial.
export const HEFAISTIA_API_URL =
  typeof window !== "undefined" && window.location.port === "4518"
    ? window.location.origin
    : "http://127.0.0.1:4518";
export const DEFAULT_KLIO_TOKEN = "dev-local";

// Chaves de localStorage usadas pelo console. Nunca inclui a chave OpenRouter
// — essa pertence só ao .env do runtime local, nunca ao navegador.
export const HEFAISTIA_STORAGE_KEYS = {
  apiUrl: "hefaistia_api_url",
  token: "hefaistia_token",
  selectedModel: "hefaistia_selected_model",
  history: "hefaistia_history",
} as const;
