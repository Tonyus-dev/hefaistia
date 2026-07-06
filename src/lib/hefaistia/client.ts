// Cliente HTTP do console visual para o runtime local da Hefaístia
// (server/hefaistia.mjs). Nunca lança exceção para a UI — toda chamada
// resolve em sucesso tipado ou em HefaistiaClientError, já com mensagem em
// português pronta para exibir.

import type {
  CreateSessionRequest,
  CreateSessionResult,
  DailyExportRequest,
  DailyExportResult,
  HefaistiaBenchmarkResult,
  HefaistiaHealth,
  KalineFallbackRequest,
  KalineFallbackResult,
  KlioChatRequest,
  KlioChatResult,
  KnowledgeList,
  OllamaModelsResponse,
  PullModelResult,
  RouteTaskRequest,
  RouteTaskResult,
  TotalidadeExportRequest,
  TotalidadeExportResult,
  SystemPaths,
  SessionsStatus,
} from "./types";

export interface HefaistiaClientConfig {
  apiUrl: string;
  token: string;
}

export interface HefaistiaClientError {
  ok: false;
  code: string;
  error: string;
  detail?: string;
  route?: string;
  suggestion?: string;
}

export type HefaistiaClientResult<T> = T | HefaistiaClientError;

export function isHefaistiaError(value: unknown): value is HefaistiaClientError {
  return Boolean(value) && typeof value === "object" && (value as { ok?: unknown }).ok === false;
}

const DEFAULT_TIMEOUT_MS = 6000;
// Chamadas que envolvem inferência real podem demorar em hardware legado —
// um pouco acima do INFERENCE_TIMEOUT_MS do runtime (120s).
const INFERENCE_TIMEOUT_MS = 130_000;
// Puxar um modelo é download real de vários GB — bem acima do PULL_TIMEOUT_MS
// do runtime (30min por padrão), só usado quando o usuário pede explicitamente.
const PULL_TIMEOUT_MS = 32 * 60 * 1000;

function unauthorizedMessage() {
  return "Token local recusado. Confira o valor de KLIO_TOKEN no runtime.";
}

async function request<T>(
  config: HefaistiaClientConfig,
  path: string,
  options: { method?: string; body?: unknown; isPublic?: boolean; timeoutMs?: number } = {},
): Promise<HefaistiaClientResult<T>> {
  const { method = "GET", body, isPublic = false, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const baseUrl = config.apiUrl.replace(/\/+$/, "");
  const url = `${baseUrl}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (!isPublic) headers.authorization = `Bearer ${config.token}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, code: "TIMEOUT", error: `Tempo esgotado ao consultar ${url}.` };
    }
    return {
      ok: false,
      code: "RUNTIME_OFFLINE",
      error: `Runtime da Hefaístia não está rodando em ${config.apiUrl}.`,
      detail: "Inicie com: bun run hefaistia",
    };
  }
  clearTimeout(timer);

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errBody =
      payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
    const code = typeof errBody.code === "string" ? errBody.code : `HTTP_${response.status}`;
    const error =
      response.status === 401
        ? unauthorizedMessage()
        : typeof errBody.error === "string"
          ? errBody.error
          : typeof errBody.message === "string"
            ? errBody.message
            : `Erro HTTP ${response.status}.`;
    const detail = typeof errBody.detail === "string" ? errBody.detail : undefined;
    const route = typeof errBody.route === "string" ? errBody.route : undefined;
    const suggestion = typeof errBody.suggestion === "string" ? errBody.suggestion : undefined;
    return { ok: false, code, error, detail, route, suggestion };
  }

  return payload as T;
}

export function createHefaistiaClient(config: HefaistiaClientConfig) {
  return {
    getHealth: () => request<HefaistiaHealth>(config, "/api/health", { isPublic: true }),

    getKnowledge: () => request<KnowledgeList>(config, "/api/knowledge"),

    getModels: () => request<OllamaModelsResponse>(config, "/api/models"),

    getLoadedModels: () => request<OllamaModelsResponse>(config, "/api/models/loaded"),

    // Download real de um modelo — só chame a partir de uma ação explícita
    // do usuário (nunca automaticamente). Pode demorar muito.
    pullModel: (model: string) =>
      request<PullModelResult>(config, "/api/models/pull", {
        method: "POST",
        body: { model },
        timeoutMs: PULL_TIMEOUT_MS,
      }),

    runBenchmark: (model?: string) =>
      request<HefaistiaBenchmarkResult>(config, "/api/benchmark", {
        method: "POST",
        body: model ? { model } : {},
        timeoutMs: INFERENCE_TIMEOUT_MS,
      }),

    sendKlioChat: (input: KlioChatRequest) =>
      request<KlioChatResult>(config, "/api/klio/chat", {
        method: "POST",
        body: input,
        timeoutMs: INFERENCE_TIMEOUT_MS,
      }),

    sendKalineFallback: (input: KalineFallbackRequest) =>
      request<KalineFallbackResult>(config, "/api/kaline/fallback", {
        method: "POST",
        body: input,
        timeoutMs: INFERENCE_TIMEOUT_MS,
      }),

    routeTask: (input: RouteTaskRequest) =>
      request<RouteTaskResult>(config, "/api/route-task", {
        method: "POST",
        body: input,
        timeoutMs: INFERENCE_TIMEOUT_MS,
      }),

    exportDailyContext: (input: DailyExportRequest) =>
      request<DailyExportResult>(config, "/api/context/export-daily", {
        method: "POST",
        body: input,
      }),

    exportTotalidadeContext: (input: TotalidadeExportRequest) =>
      request<TotalidadeExportResult>(config, "/api/context/export-totalidade", {
        method: "POST",
        body: input,
      }),

    // Cria a pasta de uma nova sessão de trabalho — só por ação explícita
    // do usuário, nunca automaticamente.
    createSession: (input: CreateSessionRequest = {}) =>
      request<CreateSessionResult>(config, "/api/sessions", {
        method: "POST",
        body: input,
      }),

    getSystemPaths: () => request<SystemPaths>(config, "/api/system/paths"),

    getSessionsStatus: () => request<SessionsStatus>(config, "/api/sessions/status"),
  };
}

export type HefaistiaClient = ReturnType<typeof createHefaistiaClient>;

// Mensagens amigáveis para os estados offline previstos no marco do projeto.
// Usada por ResultBlock e pelos painéis para nunca expor stack trace/JSON cru.
export function friendlyErrorMessage(err: HefaistiaClientError): string {
  switch (err.code) {
    case "RUNTIME_OFFLINE":
      return `${err.error}\n${err.detail ?? "Inicie com: bun run hefaistia"}`;
    case "UNAUTHORIZED":
      return unauthorizedMessage();
    case "OLLAMA_OFFLINE":
      return "Ollama está offline. A Klio Local precisa do Ollama para responder.";
    case "KALINE_FALLBACK_NOT_CONFIGURED":
      return "Kaline Fallback não está configurada. Configure OPENROUTER_API_KEY no runtime local.";
    default:
      return err.error;
  }
}
