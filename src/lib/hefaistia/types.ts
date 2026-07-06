// Contratos da Klio Hefaístia. Espelham as respostas reais do runtime local
// implementado em server/hefaistia.mjs e server/lib/*.mjs (PR 2 + PR 3).
// Servem de referência para a futura UI da forja (PR 4+) — nenhum destes
// tipos executa nada por si só.

export interface HefaistiaTask {
  source?: "manual" | "kaline-totalidade";
  target: "klio-hefaistia";
  task_type: string;
  model_hint?: string;
  priority?: "accuracy" | "speed";
  context: {
    user_goal: string;
    code?: string;
    text?: string;
    constraints?: string[];
  };
  expected_output?: {
    format: string;
    sections?: string[];
  };
}

// Resposta de POST /api/tasks.
export interface HefaistiaResult {
  status: "ok" | "error";
  model?: string;
  tokens_per_second?: number | null;
  duration_ms?: number;
  result?: string;
  warnings?: string[];
  code?: string;
  message?: string;
}

export interface HefaistiaMetrics {
  eval_count: number | null;
  eval_duration: number | null;
  total_duration: number | null;
  tokens_per_second: number | null;
}

// Resposta de POST /api/benchmark.
export interface HefaistiaBenchmarkResult {
  ok: boolean;
  model: string;
  response: string;
  metrics: HefaistiaMetrics;
  warnings: string[];
}

// Resposta de GET /api/health.
export interface HefaistiaHealth {
  ok: boolean;
  name: string;
  version: string;
  host: string;
  port: number;
  ollama: "online" | "offline";
  hestia: "online" | "offline";
  // Só indica se OPENROUTER_API_KEY existe no runtime — nunca a chave em si.
  kaline_fallback: "configured" | "not_configured";
  timestamp: string;
}

// Formato comum de erro das rotas protegidas (401, 400, 404, 405, 413, 500...).
export interface HefaistiaErrorResponse {
  ok: false;
  error: string;
  code: string;
  detail?: string;
}

// --- PR 3: Klio Local + Kaline Fallback + export diário ---------------------

export type KlioChatMode =
  "operational" | "explain_error" | "prepare_prompt" | "review_next_step" | "terminal_guide";

export interface KlioChatRequest {
  message: string;
  model?: string;
  mode?: KlioChatMode;
  context?: {
    current_project?: string;
    current_pr?: string;
    notes?: string[];
  };
}

// Resposta de POST /api/klio/chat.
export interface KlioChatResult {
  ok: boolean;
  provider: "ollama";
  model: string;
  mode: KlioChatMode;
  result: string;
  metrics: HefaistiaMetrics;
  warnings: string[];
}

export interface KalineFallbackRequest {
  message: string;
  reason?: string;
  context?: {
    project?: string;
    local_result?: string;
    notes?: string[];
  };
}

// Resposta de POST /api/kaline/fallback.
export interface KalineFallbackResult {
  ok: boolean;
  provider: "openrouter";
  model: string;
  result: string;
  warnings: string[];
}

export type TaskRoute = "klio-local" | "kaline-fallback";

export interface RouteTaskRequest {
  message: string;
  prefer?: "auto" | "local" | "kaline";
  mode?: KlioChatMode;
  context?: Record<string, unknown> & { force_fallback?: boolean };
}

// Resposta de POST /api/route-task (sucesso).
export interface RouteTaskResult {
  ok: true;
  route: TaskRoute;
  reason: string;
  result: string;
  provider: "ollama" | "openrouter";
  model: string;
  warnings: string[];
}

// Item listado em GET /api/knowledge.
export interface KnowledgeItem {
  file: string;
  chars: number;
}

// Resposta de GET /api/knowledge.
export interface KnowledgeList {
  ok: true;
  items: KnowledgeItem[];
  total_chars: number;
  warnings: string[];
}

// Item bruto retornado pelo Ollama em /api/tags e /api/ps (repassado quase
// sem alteração pelo runtime). Só os campos que a UI usa são tipados.
export interface OllamaModelSummary {
  name?: string;
  model?: string;
  size?: number;
}

// Resposta de GET /api/models e GET /api/models/loaded.
export interface OllamaModelsResponse {
  ok: true;
  models: OllamaModelSummary[];
}

// Resposta de POST /api/models/pull. Só acontece por ação explícita do
// usuário — nunca automaticamente.
export interface PullModelResult {
  ok: true;
  model: string;
  status: string;
}

export interface DailyExportRequest {
  date?: string;
  summary?: string;
  decisions?: string[];
  problems?: string[];
  next_steps?: string[];
  notes_for_totalidade?: string[];
}

// Resposta de POST /api/context/export-daily.
export interface DailyExportResult {
  ok: true;
  filename: string;
  markdown: string;
}

export type TotalidadeTypeSuggestion = "identidade" | "memoria_relacional";

export interface TotalidadeExportRequest {
  date?: string;
  type_suggestion?: TotalidadeTypeSuggestion;
  what_happened?: string;
  confirmed_decisions?: string[];
  observed_preferences?: string[];
  technical_state?: string[];
  next_steps?: string[];
}

// Resposta de POST /api/context/export-totalidade.
export interface TotalidadeExportResult {
  ok: true;
  filename: string;
  markdown: string;
}

export interface CreateSessionRequest {
  title?: string;
}

// Resposta de POST /api/sessions.
export interface CreateSessionResult {
  ok: true;
  folder: string;
  path: string;
  metadata: {
    title: string | null;
    created_at: string;
    folder: string;
  };
}

export interface SystemPaths {
  ok: true;
  configDir: string;
  dataDir: string;
  stateDir: string;
  sessionsDir: string;
}

export interface SessionsStatus {
  ok: boolean;
  sessionsDir: string;
  count: number;
}

export interface KairosCounts {
  identidade: number;
  sedimentos: number;
  reunioes: number;
  mensagens: number;
}

export interface KairosStatus {
  ok: boolean;
  configured: boolean;
  hasSnapshot: boolean;
  lastImportedAt: string | null;
  counts: KairosCounts;
}

export interface KairosEnvelope {
  v: number;
  iv: string;
  data: string;
}

export interface ImportKairosEnvelopeResult {
  ok: boolean;
  importedAt: string;
  counts: KairosCounts;
}

export interface KairosContextResult {
  ok: boolean;
  context: string;
}
