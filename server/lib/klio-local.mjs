// Klio Local — camada operacional pequena da Hefaístia, rodando via Ollama.
// Guia passos simples. Não decide tarefas críticas sozinha.

import { KLIO_LOCAL_MODEL, OLLAMA_URL, INFERENCE_TIMEOUT_MS } from "./config.mjs";
import { fetchWithTimeout, buildMetrics } from "./http.mjs";

export const KLIO_CHAT_MODES = [
  "operational",
  "explain_error",
  "prepare_prompt",
  "review_next_step",
  "terminal_guide",
];

const KLIO_LOCAL_IDENTITY = `Você é Klio Local, uma camada operacional pequena da Hefaístia.
Você não é a Kaline.
Você não substitui a Totalidade.
Você não decide tarefas críticas sozinha.
Você ajuda Ká a agir com passos simples.

Seu estilo:
- direto;
- curto;
- técnico sem jargão desnecessário;
- um próximo passo por vez;
- sem condescendência;
- sem fingir que executou algo.

Você trabalha sob o Modo Ponytail:
o melhor código é o código que nunca foi escrito.

Regras:
- não invente arquivos;
- não invente comandos;
- não diga que testou se não testou;
- não sugira comandos destrutivos;
- não execute shell;
- se a tarefa for complexa, recomende fallback Kaline;
- se a tarefa envolver arquitetura grande, diga que precisa da Kaline.`;

export function buildKlioLocalSystemPrompt(knowledgeText) {
  const marcos = knowledgeText?.trim() ? knowledgeText.trim() : "(nenhum marco carregado)";
  return `${KLIO_LOCAL_IDENTITY}\n\nMarcos locais:\n${marcos}`;
}

function buildUserMessage({ message, mode, context }) {
  const lines = [`Modo: ${mode}`, "", "Mensagem:", message];

  if (context && typeof context === "object") {
    if (context.current_project) lines.push("", `Projeto atual: ${context.current_project}`);
    if (context.current_pr) lines.push(`PR atual: ${context.current_pr}`);
    if (Array.isArray(context.notes) && context.notes.length > 0) {
      lines.push("", "Notas:");
      for (const note of context.notes) lines.push(`- ${note}`);
    }
  }

  return lines.join("\n");
}

// Consulta a Klio Local via Ollama /api/chat. Retorna um objeto de sucesso ou
// lança um erro com `.code` ("OLLAMA_OFFLINE" | "OLLAMA_ERROR") para o
// chamador decidir o status HTTP.
export async function callKlioLocal({ message, model, mode, context }, knowledgeText) {
  const resolvedModel = model?.trim() || KLIO_LOCAL_MODEL;
  const resolvedMode = mode?.trim() || "operational";

  let upstream;
  try {
    upstream = await fetchWithTimeout(
      `${OLLAMA_URL}/api/chat`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: resolvedModel,
          stream: false,
          messages: [
            { role: "system", content: buildKlioLocalSystemPrompt(knowledgeText) },
            { role: "user", content: buildUserMessage({ message, mode: resolvedMode, context }) },
          ],
          options: { temperature: 0.2 },
        }),
      },
      INFERENCE_TIMEOUT_MS,
    );
  } catch (err) {
    const offlineError = new Error(`Ollama offline ou indisponível em ${OLLAMA_URL}.`);
    offlineError.code = "OLLAMA_OFFLINE";
    offlineError.cause = err;
    throw offlineError;
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    const upstreamError = new Error(`Ollama respondeu com erro (${upstream.status}).`);
    upstreamError.code = "OLLAMA_ERROR";
    upstreamError.detail = text ? text.slice(0, 300) : undefined;
    throw upstreamError;
  }

  const data = await upstream.json();
  const metrics = buildMetrics(data);
  const warnings = [];
  if (metrics.tokens_per_second === null) {
    warnings.push("Ollama não retornou eval_count/eval_duration para esta chamada.");
  }

  return {
    ok: true,
    provider: "ollama",
    model: resolvedModel,
    mode: resolvedMode,
    result: data.message?.content ?? "",
    metrics,
    warnings,
  };
}
