// Gera o contexto diário em Markdown copiável — nunca escrito em disco,
// nunca enviado para a Totalidade automaticamente. Espelha o template em
// knowledge/export-diario-template.md.

import { KALINE_CONTEXT_EXPORT_MAX_ITEMS } from "./config.mjs";

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Remove cercas de código embutidas (que quebrariam a formatação do
// Markdown final) e normaliza espaços em branco.
function sanitizeText(value) {
  return String(value ?? "")
    .replace(/```/g, "'''")
    .trim();
}

function toItemList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, KALINE_CONTEXT_EXPORT_MAX_ITEMS)
    .map((item) => sanitizeText(item))
    .filter((item) => item.length > 0);
}

function renderList(items) {
  if (items.length === 0) return "(nenhum item informado)";
  return items.map((item) => `- ${item}`).join("\n");
}

export function buildDailyExportMarkdown(body) {
  const date = sanitizeText(body?.date) || today();
  const summary = sanitizeText(body?.summary) || "(sem resumo informado)";
  const decisions = renderList(toItemList(body?.decisions));
  const problems = renderList(toItemList(body?.problems));
  const nextSteps = renderList(toItemList(body?.next_steps));
  const notesForTotalidade = renderList(toItemList(body?.notes_for_totalidade));

  const markdown = `# Contexto diário — Klio Hefaístia

Data: ${date}

## Resumo operacional

${summary}

## Decisões tomadas

${decisions}

## Problemas encontrados

${problems}

## Próximos passos sugeridos

${nextSteps}

## Observações para a Kaline Totalidade

${notesForTotalidade}

---

Este contexto foi gerado localmente pela Klio Hefaístia.
Ele não foi salvo automaticamente na Totalidade.
Ká deve revisar e colar manualmente se quiser sedimentar.
`;

  return { filename: `kaline-contexto-diario-${date}.md`, markdown };
}

const TYPE_SUGGESTIONS = new Set(["identidade", "memoria_relacional"]);

// Bloco assistido para colar manualmente na Kaline Totalidade. Nunca escreve
// em disco, nunca chama a Totalidade, nunca representa sincronização
// automática — é só um Markdown pronto para revisão humana.
export function buildTotalidadeExportMarkdown(body) {
  const date = sanitizeText(body?.date) || today();
  const typeSuggestion = TYPE_SUGGESTIONS.has(body?.type_suggestion)
    ? body.type_suggestion
    : "memoria_relacional";
  const whatHappened = sanitizeText(body?.what_happened) || "(nada informado)";
  const confirmedDecisions = renderList(toItemList(body?.confirmed_decisions));
  const observedPreferences = renderList(toItemList(body?.observed_preferences));
  const technicalState = renderList(toItemList(body?.technical_state));
  const nextSteps = renderList(toItemList(body?.next_steps));

  const markdown = `# Contexto externo — Klio Hefaístia

Tipo sugerido: ${typeSuggestion}
Origem: Klio Hefaístia local
Data: ${date}

## O que aconteceu

${whatHappened}

## Decisões confirmadas por Ká

${confirmedDecisions}

## Preferências observadas

${observedPreferences}

## Estado técnico da Hefaístia

${technicalState}

## Próximos passos

${nextSteps}

## Nota de cautela

Este bloco foi gerado localmente pela Klio Hefaístia.
Ele deve ser revisado por Ká antes de ser colado na Kaline Totalidade.
Não representa sincronização automática.
`;

  return { filename: `totalidade-contexto-klio-hefaistia-${date}.md`, markdown };
}
