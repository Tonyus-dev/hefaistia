// Helpers HTTP compartilhados por todos os handlers da Hefaístia.

import { MAX_BODY_BYTES } from "./config.mjs";

// A Hefaístia é loopback-only, mas o Console Visual da Forja (PR 4) roda em
// origem diferente (porta do Vite, tipicamente 5173) — sem isto, o navegador
// bloqueia toda resposta por CORS mesmo com a requisição HTTP tendo sucesso.
// Só reflete a origem se ela também for loopback; nunca usa "*".
const LOOPBACK_ORIGIN_RE = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/;

// Aplica CORS restrito a loopback. Retorna `true` se a requisição já foi
// respondida (preflight OPTIONS) — o chamador deve parar o processamento.
export function applyLoopbackCors(req, res) {
  const origin = req.headers.origin;
  if (origin && LOOPBACK_ORIGIN_RE.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true;
  }

  return false;
}

export function sendJson(res, status, payload) {
  if (res.headersSent) return;
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

export function errorPayload(code, message, detail) {
  const payload = { ok: false, error: message, code };
  if (detail) payload.detail = detail;
  return payload;
}

export async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function checkOnline(url, timeoutMs) {
  try {
    const res = await fetchWithTimeout(url, { method: "GET" }, timeoutMs);
    return res.ok ? "online" : "offline";
  } catch {
    return "offline";
  }
}

export async function sendUpstreamError(res, upstream) {
  const text = await upstream.text().catch(() => "");
  sendJson(res, 502, {
    ok: false,
    error: `Ollama respondeu com erro (${upstream.status}).`,
    code: "OLLAMA_ERROR",
    detail: text ? text.slice(0, 300) : undefined,
  });
}

// Calcula métricas reais a partir da resposta do Ollama. Nunca inventa
// tokens/s — se eval_count/eval_duration não vierem, o campo é `null`.
export function buildMetrics(data) {
  const evalCount = typeof data?.eval_count === "number" ? data.eval_count : null;
  const evalDuration = typeof data?.eval_duration === "number" ? data.eval_duration : null;
  const totalDuration = typeof data?.total_duration === "number" ? data.total_duration : null;
  const tokensPerSecond =
    evalCount !== null && evalDuration ? evalCount / (evalDuration / 1e9) : null;
  return {
    eval_count: evalCount,
    eval_duration: evalDuration,
    total_duration: totalDuration,
    tokens_per_second: tokensPerSecond,
  };
}

// Lê e valida o corpo da requisição como JSON. Em caso de erro, já envia a
// resposta de erro e retorna `undefined` — o chamador deve checar isso e
// simplesmente retornar sem fazer mais nada.
export function readJsonBody(req, res) {
  return new Promise((resolve) => {
    const declaredLength = Number.parseInt(req.headers["content-length"] || "0", 10);
    if (declaredLength > MAX_BODY_BYTES) {
      sendJson(
        res,
        413,
        errorPayload("BODY_TOO_LARGE", "Corpo da requisição excede o limite permitido."),
      );
      req.destroy();
      resolve(undefined);
      return;
    }

    const chunks = [];
    let total = 0;
    let settled = false;

    req.on("data", (chunk) => {
      if (settled) return;
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        settled = true;
        sendJson(
          res,
          413,
          errorPayload("BODY_TOO_LARGE", "Corpo da requisição excede o limite permitido."),
        );
        req.destroy();
        resolve(undefined);
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (settled) return;
      settled = true;
      const raw = Buffer.concat(chunks).toString("utf-8");
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        sendJson(res, 400, errorPayload("BAD_JSON", "JSON inválido no corpo da requisição."));
        resolve(undefined);
      }
    });

    req.on("error", () => {
      if (settled) return;
      settled = true;
      sendJson(res, 400, errorPayload("BAD_REQUEST", "Falha ao ler o corpo da requisição."));
      resolve(undefined);
    });
  });
}
