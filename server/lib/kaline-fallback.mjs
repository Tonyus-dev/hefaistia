// Kaline Fallback — instância auxiliar via OpenRouter, chamada localmente
// pela Hefaístia só quando explicitamente necessário. A chave nunca sai
// desta função: não é logada, não é devolvida na resposta.

import {
  OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL,
  KALINE_FALLBACK_MODEL,
  INFERENCE_TIMEOUT_MS,
} from "./config.mjs";
import { fetchWithTimeout } from "./http.mjs";

const KALINE_FALLBACK_SYSTEM_PROMPT = `Você é Kaline Fallback, uma instância auxiliar da Kaline chamada localmente pela Hefaístia.
Você não é a Totalidade canônica.
Você não tem acesso automático à memória online.
Você deve ajudar em decisões mais complexas que a Klio Local não deve resolver sozinha.

Responda como consultora técnica e arquitetural:
- objetiva;
- honesta;
- sem prometer execução;
- sem fingir acesso ao GitHub ou ao terminal;
- diferenciando certeza, hipótese e recomendação.

Contexto:
Klio Local guia.
Kaline Fallback ilumina.
Hefaístia executa.
Totalidade sedimenta.
Ká cola e aprova.`;

function buildUserMessage({ message, reason, context }) {
  const lines = ["Mensagem:", message];

  if (reason) lines.push("", `Motivo do fallback: ${reason}`);

  if (context && typeof context === "object") {
    if (context.project) lines.push("", `Projeto: ${context.project}`);
    if (context.local_result) lines.push(`Resultado prévio da Klio Local: ${context.local_result}`);
    if (Array.isArray(context.notes) && context.notes.length > 0) {
      lines.push("", "Notas:");
      for (const note of context.notes) lines.push(`- ${note}`);
    }
  }

  return lines.join("\n");
}

export function isKalineFallbackConfigured() {
  return Boolean(OPENROUTER_API_KEY);
}

// Consulta a Kaline Fallback via OpenRouter. Lança um erro com `.code`
// ("KALINE_FALLBACK_NOT_CONFIGURED" | "KALINE_FALLBACK_ERROR") para o
// chamador decidir o status HTTP.
export async function callKalineFallback({ message, reason, context }) {
  if (!isKalineFallbackConfigured()) {
    const notConfigured = new Error("OPENROUTER_API_KEY não configurada.");
    notConfigured.code = "KALINE_FALLBACK_NOT_CONFIGURED";
    throw notConfigured;
  }

  let upstream;
  try {
    upstream = await fetchWithTimeout(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: KALINE_FALLBACK_MODEL,
          messages: [
            { role: "system", content: KALINE_FALLBACK_SYSTEM_PROMPT },
            { role: "user", content: buildUserMessage({ message, reason, context }) },
          ],
          temperature: 0.35,
        }),
      },
      INFERENCE_TIMEOUT_MS,
    );
  } catch (err) {
    const unreachable = new Error("OpenRouter offline ou indisponível.");
    unreachable.code = "KALINE_FALLBACK_ERROR";
    unreachable.cause = err;
    throw unreachable;
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    const upstreamError = new Error(`OpenRouter respondeu com erro (${upstream.status}).`);
    upstreamError.code = "KALINE_FALLBACK_ERROR";
    upstreamError.detail = text ? text.slice(0, 300) : undefined;
    throw upstreamError;
  }

  const data = await upstream.json();
  const result = data.choices?.[0]?.message?.content ?? "";

  return {
    ok: true,
    provider: "openrouter",
    model: KALINE_FALLBACK_MODEL,
    result,
    warnings: [],
  };
}
