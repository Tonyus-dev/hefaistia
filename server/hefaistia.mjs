#!/usr/bin/env node
/**
 * Klio Hefaístia — runtime local (PR 2 + PR 3).
 *
 * Worker local que fala com o Ollama em execução na mesma máquina e, desde
 * o PR 3, decide entre Klio Local (Ollama, pequena, dirigida por
 * knowledge/*.md) e Kaline Fallback (OpenRouter, só quando necessário). Não
 * usa Supabase, banco de dados ou shell. Não lê nem escreve arquivos
 * arbitrários. A UI operacional ainda não existe — isso aqui é só a API
 * local.
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  KLIO_HOST,
  KLIO_PORT,
  KLIO_TOKEN,
  OLLAMA_URL,
  DEFAULT_MODEL,
  HESTIA_URL,
  HEALTH_TIMEOUT_MS,
  PROXY_TIMEOUT_MS,
  INFERENCE_TIMEOUT_MS,
  PULL_TIMEOUT_MS,
  enforceLanSafety,
} from "./lib/config.mjs";
import {
  sendJson,
  errorPayload,
  fetchWithTimeout,
  checkOnline,
  sendUpstreamError,
  buildMetrics,
  readJsonBody,
  applyLoopbackCors,
} from "./lib/http.mjs";
import { loadKnowledge } from "./lib/knowledge.mjs";
import { KLIO_CHAT_MODES, callKlioLocal } from "./lib/klio-local.mjs";
import { callKalineFallback, isKalineFallbackConfigured } from "./lib/kaline-fallback.mjs";
import { decideRoute } from "./lib/task-router.mjs";
import { buildDailyExportMarkdown, buildTotalidadeExportMarkdown } from "./lib/daily-export.mjs";
import { createSession } from "./lib/sessions.mjs";

enforceLanSafety();

// Mesmo texto de src/lib/hefaistia/prompt.ts. Duplicado aqui porque este é
// um script Node puro (.mjs) rodando fora do build TypeScript/Vite. Usado
// só por /api/tasks — é um prompt distinto do da Klio Local (PR 3).
const HEFAISTIA_SYSTEM_PROMPT = `Você é Klio Hefaístia, worker local da Kaline.

Você não é a Kaline.
Você não é chat principal.
Você não decide a resposta final.
Você executa tarefas técnicas localmente.

Não invente arquivos, APIs, rotas ou dependências.
Não reescreva tudo sem necessidade.
Prefira diagnóstico bruto, patch mínimo e riscos reais.
Quando não souber, diga que não sabe.`;

// ---------------------------------------------------------------------------
// Console visual estático (PR 8)
// ---------------------------------------------------------------------------

const RUNTIME_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.dirname(RUNTIME_DIR);
const BUILD_CANDIDATES = ["dist/client", "dist", ".output/public"];
const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};

function findConsoleBuild() {
  for (const candidate of BUILD_CANDIDATES) {
    const dir = path.resolve(REPO_ROOT, candidate);
    const indexPath = path.join(dir, "index.html");
    if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) return { dir, indexPath };

    const assetsDir = path.join(dir, "assets");
    if (!fs.existsSync(assetsDir) || !fs.statSync(assetsDir).isDirectory()) continue;
    const entry = fs.readdirSync(assetsDir).find((file) => /^index-.+\.js$/.test(file));
    if (entry) return { dir, indexHtml: buildConsoleShell(entry) };
  }
  return null;
}

function buildConsoleShell(entry) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#08080e"><title>Klio Hefaístia</title><script type="module" src="/assets/${entry}"></script></head><body><div id="root"></div></body></html>`;
}

function sendHtml(res, status, html) {
  res.writeHead(status, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(html);
}

function sendConsoleNotBuilt(res) {
  sendHtml(
    res,
    200,
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Klio Hefaístia</title></head><body><main><h1>Console Visual ainda não foi buildado.</h1><p>Rode: <code>bun run build</code></p><p>Depois: <code>bun run hefaistia</code></p></main></body></html>`,
  );
}

function safeBuildPath(buildDir, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const relative = decoded.replace(/^\/+/, "") || "index.html";
  const filePath = path.resolve(buildDir, relative);
  const relativeFromBuild = path.relative(buildDir, filePath);
  if (relativeFromBuild.startsWith("..") || path.isAbsolute(relativeFromBuild)) return null;
  return filePath;
}

function serveFile(res, filePath) {
  const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, {
    "content-type": `${type}${type.startsWith("text/") ? "; charset=utf-8" : ""}`,
    "cache-control":
      path.basename(filePath) === "index.html" ? "no-store" : "public, max-age=31536000, immutable",
  });
  fs.createReadStream(filePath).pipe(res);
}

function handleStaticConsole(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(
      res,
      405,
      errorPayload("METHOD_NOT_ALLOWED", `Método ${req.method} não suportado em ${pathname}.`),
    );
    return;
  }

  const build = findConsoleBuild();
  if (!build) {
    sendConsoleNotBuilt(res);
    return;
  }

  const requestedPath = safeBuildPath(build.dir, pathname);
  const sendIndex = () =>
    build.indexPath ? serveFile(res, build.indexPath) : sendHtml(res, 200, build.indexHtml);
  if (!requestedPath) {
    sendIndex();
    return;
  }

  try {
    const stat = fs.statSync(requestedPath);
    if (stat.isFile()) {
      serveFile(res, requestedPath);
      return;
    }
  } catch {
    // Fallback de SPA abaixo.
  }

  sendIndex();
}

// ---------------------------------------------------------------------------
// Tarefas estruturadas (POST /api/tasks)
// ---------------------------------------------------------------------------

function validateTask(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Corpo da tarefa inválido." };
  }
  if (body.target !== "klio-hefaistia") {
    return { ok: false, message: 'target deve ser "klio-hefaistia".' };
  }
  if (
    body.source !== undefined &&
    body.source !== "manual" &&
    body.source !== "kaline-totalidade"
  ) {
    return { ok: false, message: 'source deve ser "manual" ou "kaline-totalidade".' };
  }
  if (typeof body.task_type !== "string" || !body.task_type.trim()) {
    return { ok: false, message: "task_type é obrigatório." };
  }
  if (
    !body.context ||
    typeof body.context !== "object" ||
    typeof body.context.user_goal !== "string" ||
    !body.context.user_goal.trim()
  ) {
    return { ok: false, message: "context.user_goal é obrigatório." };
  }
  return { ok: true, task: body };
}

function formatTaskPrompt(task) {
  const { task_type, priority, context, expected_output } = task;
  const lines = [`Tarefa: ${task_type}`, "", "Objetivo do usuário:", context.user_goal];

  if (priority) {
    lines.push("", "Prioridade:", priority);
  }

  if (Array.isArray(context.constraints) && context.constraints.length > 0) {
    lines.push("", "Restrições:");
    for (const constraint of context.constraints) lines.push(`- ${constraint}`);
  }

  if (context.code) {
    lines.push("", "Código:", "```text", context.code, "```");
  }

  if (context.text) {
    lines.push("", "Texto adicional:", context.text);
  }

  if (expected_output?.format) {
    lines.push("", `Formato esperado: ${expected_output.format}`);
  }

  if (Array.isArray(expected_output?.sections) && expected_output.sections.length > 0) {
    lines.push("Seções esperadas:");
    for (const section of expected_output.sections) lines.push(`- ${section}`);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Handlers — PR 2 (Ollama MVP)
// ---------------------------------------------------------------------------

async function handleHealth(req, res) {
  const [ollama, hestia] = await Promise.all([
    checkOnline(`${OLLAMA_URL}/api/tags`, HEALTH_TIMEOUT_MS),
    checkOnline(`${HESTIA_URL}/api/health`, HEALTH_TIMEOUT_MS),
  ]);
  sendJson(res, 200, {
    ok: true,
    name: "Klio Hefaístia",
    version: "0.1.0",
    host: KLIO_HOST,
    port: KLIO_PORT,
    ollama,
    hestia,
    // Só indica se OPENROUTER_API_KEY existe — nunca a própria chave. Usado
    // pelo painel de diagnóstico do console (PR 5) para não fingir que o
    // fallback está disponível quando não está.
    kaline_fallback: isKalineFallbackConfigured() ? "configured" : "not_configured",
    timestamp: new Date().toISOString(),
  });
}

async function handleModels(req, res) {
  try {
    const upstream = await fetchWithTimeout(
      `${OLLAMA_URL}/api/tags`,
      { method: "GET" },
      PROXY_TIMEOUT_MS,
    );
    if (!upstream.ok) return sendUpstreamError(res, upstream);
    const data = await upstream.json();
    sendJson(res, 200, { ok: true, models: data.models ?? [] });
  } catch {
    sendJson(
      res,
      502,
      errorPayload("OLLAMA_OFFLINE", `Ollama offline ou indisponível em ${OLLAMA_URL}.`),
    );
  }
}

async function handleModelsLoaded(req, res) {
  try {
    const upstream = await fetchWithTimeout(
      `${OLLAMA_URL}/api/ps`,
      { method: "GET" },
      PROXY_TIMEOUT_MS,
    );
    if (!upstream.ok) return sendUpstreamError(res, upstream);
    const data = await upstream.json();
    sendJson(res, 200, { ok: true, models: data.models ?? [] });
  } catch {
    sendJson(
      res,
      502,
      errorPayload("OLLAMA_OFFLINE", `Ollama offline ou indisponível em ${OLLAMA_URL}.`),
    );
  }
}

// Puxa um modelo do registry do Ollama. Só executa quando o usuário pede
// explicitamente pela UI/curl — nunca é chamado automaticamente por nenhum
// outro endpoint. Bloqueia até o Ollama terminar o download (stream: false),
// então pode demorar bastante em modelos grandes ou conexões lentas.
async function handlePullModel(req, res) {
  const body = await readJsonBody(req, res);
  if (body === undefined) return;

  if (typeof body.model !== "string" || !body.model.trim()) {
    sendJson(res, 400, errorPayload("BAD_REQUEST", "model é obrigatório."));
    return;
  }

  const model = body.model.trim();

  try {
    const upstream = await fetchWithTimeout(
      `${OLLAMA_URL}/api/pull`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model, stream: false }),
      },
      PULL_TIMEOUT_MS,
    );

    if (!upstream.ok) return sendUpstreamError(res, upstream);

    const data = await upstream.json();
    if (data.error) {
      sendJson(
        res,
        502,
        errorPayload("OLLAMA_ERROR", `Ollama não conseguiu puxar "${model}".`, data.error),
      );
      return;
    }

    sendJson(res, 200, { ok: true, model, status: data.status ?? "success" });
  } catch {
    sendJson(
      res,
      502,
      errorPayload("OLLAMA_OFFLINE", `Ollama offline ou indisponível em ${OLLAMA_URL}.`),
    );
  }
}

async function handleBenchmark(req, res) {
  const body = await readJsonBody(req, res);
  if (body === undefined) return;

  const model =
    typeof body.model === "string" && body.model.trim() ? body.model.trim() : DEFAULT_MODEL;

  try {
    const upstream = await fetchWithTimeout(
      `${OLLAMA_URL}/api/generate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          prompt: "Diga apenas: Olá, sistema online.",
          options: { temperature: 0 },
        }),
      },
      INFERENCE_TIMEOUT_MS,
    );
    if (!upstream.ok) return sendUpstreamError(res, upstream);

    const data = await upstream.json();
    const metrics = buildMetrics(data);
    sendJson(res, 200, {
      ok: true,
      model,
      response: data.response ?? "",
      metrics,
      warnings:
        metrics.tokens_per_second === null
          ? ["Ollama não retornou eval_count/eval_duration para esta chamada."]
          : [],
    });
  } catch {
    sendJson(
      res,
      502,
      errorPayload("OLLAMA_OFFLINE", `Ollama offline ou indisponível em ${OLLAMA_URL}.`),
    );
  }
}

async function handleTasks(req, res) {
  const body = await readJsonBody(req, res);
  if (body === undefined) return;

  const validation = validateTask(body);
  if (!validation.ok) {
    sendJson(res, 400, {
      status: "error",
      code: "BAD_REQUEST",
      message: validation.message,
      warnings: [],
    });
    return;
  }

  const task = validation.task;
  const model =
    typeof task.model_hint === "string" && task.model_hint.trim()
      ? task.model_hint.trim()
      : DEFAULT_MODEL;
  const startedAt = Date.now();

  try {
    const upstream = await fetchWithTimeout(
      `${OLLAMA_URL}/api/chat`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            { role: "system", content: HEFAISTIA_SYSTEM_PROMPT },
            { role: "user", content: formatTaskPrompt(task) },
          ],
          options: { temperature: 0.1 },
        }),
      },
      INFERENCE_TIMEOUT_MS,
    );

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      sendJson(res, 502, {
        status: "error",
        code: "OLLAMA_ERROR",
        message: `Ollama respondeu com erro (${upstream.status}).`,
        warnings: text ? [text.slice(0, 300)] : [],
      });
      return;
    }

    const data = await upstream.json();
    const metrics = buildMetrics(data);
    const warnings = [];
    if (metrics.tokens_per_second === null) {
      warnings.push("Ollama não retornou eval_count/eval_duration para esta chamada.");
    }

    sendJson(res, 200, {
      status: "ok",
      model,
      tokens_per_second: metrics.tokens_per_second,
      duration_ms: Date.now() - startedAt,
      result: data.message?.content ?? "",
      warnings,
    });
  } catch {
    sendJson(res, 502, {
      status: "error",
      code: "OLLAMA_OFFLINE",
      message: `Ollama offline ou indisponível em ${OLLAMA_URL}.`,
      warnings: [],
    });
  }
}

// ---------------------------------------------------------------------------
// Handlers — PR 3 (Klio Local dirigida + fallback Kaline + export diário)
// ---------------------------------------------------------------------------

async function handleKnowledge(req, res) {
  const { items, total_chars, warnings } = await loadKnowledge();
  sendJson(res, 200, { ok: true, items, total_chars, warnings });
}

async function handleKlioChat(req, res) {
  const body = await readJsonBody(req, res);
  if (body === undefined) return;

  if (typeof body.message !== "string" || !body.message.trim()) {
    sendJson(res, 400, errorPayload("BAD_REQUEST", "message é obrigatório."));
    return;
  }

  if (body.mode !== undefined && !KLIO_CHAT_MODES.includes(body.mode)) {
    sendJson(
      res,
      400,
      errorPayload("BAD_REQUEST", `mode inválido. Use um de: ${KLIO_CHAT_MODES.join(", ")}.`),
    );
    return;
  }

  const { text: knowledgeText } = await loadKnowledge();

  try {
    const result = await callKlioLocal(
      { message: body.message, model: body.model, mode: body.mode, context: body.context },
      knowledgeText,
    );
    sendJson(res, 200, result);
  } catch (err) {
    sendJson(res, 502, {
      ok: false,
      code: err.code || "OLLAMA_ERROR",
      error: err.message,
    });
  }
}

async function handleKalineFallback(req, res) {
  const body = await readJsonBody(req, res);
  if (body === undefined) return;

  if (typeof body.message !== "string" || !body.message.trim()) {
    sendJson(res, 400, errorPayload("BAD_REQUEST", "message é obrigatório."));
    return;
  }

  try {
    const result = await callKalineFallback({
      message: body.message,
      reason: body.reason,
      context: body.context,
    });
    sendJson(res, 200, result);
  } catch (err) {
    const status = err.code === "KALINE_FALLBACK_NOT_CONFIGURED" ? 503 : 502;
    sendJson(res, status, {
      ok: false,
      code: err.code || "KALINE_FALLBACK_ERROR",
      error: err.message,
    });
  }
}

async function handleRouteTask(req, res) {
  const body = await readJsonBody(req, res);
  if (body === undefined) return;

  if (typeof body.message !== "string" || !body.message.trim()) {
    sendJson(res, 400, errorPayload("BAD_REQUEST", "message é obrigatório."));
    return;
  }

  if (body.prefer !== undefined && !["auto", "local", "kaline"].includes(body.prefer)) {
    sendJson(res, 400, errorPayload("BAD_REQUEST", 'prefer deve ser "auto", "local" ou "kaline".'));
    return;
  }

  const decision = decideRoute({
    message: body.message,
    prefer: body.prefer,
    context: body.context,
  });

  if (decision.route === "kaline-fallback") {
    if (!isKalineFallbackConfigured()) {
      sendJson(res, 503, {
        ok: false,
        route: "kaline-fallback",
        code: "KALINE_FALLBACK_NOT_CONFIGURED",
        error: "OPENROUTER_API_KEY não configurada.",
        suggestion: "Use prefer='local' ou configure OPENROUTER_API_KEY.",
      });
      return;
    }

    try {
      const result = await callKalineFallback({
        message: body.message,
        reason: decision.reason,
        context: body.context,
      });
      sendJson(res, 200, { ...result, route: "kaline-fallback", reason: decision.reason });
    } catch (err) {
      const status = err.code === "KALINE_FALLBACK_NOT_CONFIGURED" ? 503 : 502;
      sendJson(res, status, {
        ok: false,
        route: "kaline-fallback",
        code: err.code || "KALINE_FALLBACK_ERROR",
        error: err.message,
      });
    }
    return;
  }

  const { text: knowledgeText } = await loadKnowledge();
  try {
    const result = await callKlioLocal(
      { message: body.message, mode: body.mode, context: body.context },
      knowledgeText,
    );
    sendJson(res, 200, { ...result, route: "klio-local", reason: decision.reason });
  } catch (err) {
    sendJson(res, 502, {
      ok: false,
      route: "klio-local",
      code: err.code || "OLLAMA_ERROR",
      error: err.message,
    });
  }
}

async function handleExportDaily(req, res) {
  const body = await readJsonBody(req, res);
  if (body === undefined) return;

  const { filename, markdown } = buildDailyExportMarkdown(body);
  sendJson(res, 200, { ok: true, filename, markdown });
}

// Bloco assistido para a Kaline Totalidade — só Markdown, nunca escreve em
// disco, nunca chama a Totalidade/Supabase, nunca exige OpenRouter, funciona
// com o Ollama offline.
async function handleExportTotalidade(req, res) {
  const body = await readJsonBody(req, res);
  if (body === undefined) return;

  const { filename, markdown } = buildTotalidadeExportMarkdown(body);
  sendJson(res, 200, { ok: true, filename, markdown });
}

// Cria a pasta de uma nova sessão de trabalho, só por ação explícita do
// usuário (botão "Nova sessão" no console). Escreve só dentro de sessions/ —
// nunca aceita path do cliente, nunca lê/apaga nada.
async function handleCreateSession(req, res) {
  const body = await readJsonBody(req, res);
  if (body === undefined) return;

  const title = typeof body.title === "string" ? body.title : undefined;

  try {
    const session = await createSession({ title });
    sendJson(res, 200, { ok: true, ...session });
  } catch (err) {
    console.error("[hefaistia] falha ao criar sessão:", err);
    sendJson(res, 500, errorPayload("INTERNAL_ERROR", "Não foi possível criar a pasta de sessão."));
  }
}

// ---------------------------------------------------------------------------
// Roteamento
// ---------------------------------------------------------------------------

const ROUTES = [
  { method: "GET", path: "/api/health", handler: handleHealth, public: true },
  { method: "GET", path: "/api/models", handler: handleModels },
  { method: "GET", path: "/api/models/loaded", handler: handleModelsLoaded },
  { method: "POST", path: "/api/models/pull", handler: handlePullModel },
  { method: "POST", path: "/api/benchmark", handler: handleBenchmark },
  { method: "POST", path: "/api/tasks", handler: handleTasks },
  { method: "GET", path: "/api/knowledge", handler: handleKnowledge },
  { method: "POST", path: "/api/klio/chat", handler: handleKlioChat },
  { method: "POST", path: "/api/kaline/fallback", handler: handleKalineFallback },
  { method: "POST", path: "/api/route-task", handler: handleRouteTask },
  { method: "POST", path: "/api/context/export-daily", handler: handleExportDaily },
  { method: "POST", path: "/api/context/export-totalidade", handler: handleExportTotalidade },
  { method: "POST", path: "/api/sessions", handler: handleCreateSession },
];

const server = http.createServer(async (req, res) => {
  try {
    if (applyLoopbackCors(req, res)) return;

    const url = new URL(req.url, `http://${req.headers.host || `${KLIO_HOST}:${KLIO_PORT}`}`);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    const routesForPath = ROUTES.filter((route) => route.path === pathname);
    if (routesForPath.length === 0) {
      if (pathname === "/api" || pathname.startsWith("/api/")) {
        sendJson(res, 404, errorPayload("NOT_FOUND", "Rota não encontrada."));
        return;
      }
      handleStaticConsole(req, res, url.pathname);
      return;
    }

    const route = routesForPath.find((candidate) => candidate.method === req.method);
    if (!route) {
      sendJson(
        res,
        405,
        errorPayload("METHOD_NOT_ALLOWED", `Método ${req.method} não suportado em ${pathname}.`),
      );
      return;
    }

    if (!route.public) {
      const expected = `Bearer ${KLIO_TOKEN}`;
      if (req.headers.authorization !== expected) {
        sendJson(
          res,
          401,
          errorPayload("UNAUTHORIZED", "Não autorizado", "Use Authorization: Bearer <KLIO_TOKEN>."),
        );
        return;
      }
    }

    await route.handler(req, res);
  } catch (err) {
    console.error("[hefaistia] erro interno:", err);
    sendJson(res, 500, errorPayload("INTERNAL_ERROR", "Erro interno."));
  }
});

server.listen(KLIO_PORT, KLIO_HOST, () => {
  console.log(`[hefaistia] Klio Hefaístia ouvindo em http://${KLIO_HOST}:${KLIO_PORT}`);
  console.log(`[hefaistia] Ollama esperado em ${OLLAMA_URL}`);
  console.log(`[hefaistia] Héstia (opcional) esperada em ${HESTIA_URL}`);
});
