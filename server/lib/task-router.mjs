// Heurística simples de roteamento entre Klio Local e Kaline Fallback.
// Não usa LLM para decidir — texto e tamanho da mensagem bastam neste PR.

const KALINE_KEYWORDS = [
  "arquitetura",
  "integração com totalidade",
  "pr grande",
  "segurança",
  "banco",
  "supabase",
  "cloudflare",
  "openrouter",
  "estratégia",
  "decisão de merge",
  "refatoração grande",
];

const LARGE_MESSAGE_THRESHOLD = 2000;

export function decideRoute({ message, prefer, context }) {
  const normalizedPrefer = prefer?.trim().toLowerCase() || "auto";

  if (normalizedPrefer === "local") {
    return { route: "klio-local", reason: "prefer=local" };
  }

  if (normalizedPrefer === "kaline") {
    return { route: "kaline-fallback", reason: "prefer=kaline" };
  }

  if (context?.force_fallback === true) {
    return { route: "kaline-fallback", reason: "context.force_fallback=true" };
  }

  const normalizedMessage = (message || "").toLowerCase();
  const matchedKeyword = KALINE_KEYWORDS.find((keyword) => normalizedMessage.includes(keyword));
  if (matchedKeyword) {
    return { route: "kaline-fallback", reason: `mensagem contém termo "${matchedKeyword}"` };
  }

  if ((message || "").length > LARGE_MESSAGE_THRESHOLD) {
    return {
      route: "kaline-fallback",
      reason: `mensagem excede ${LARGE_MESSAGE_THRESHOLD} caracteres`,
    };
  }

  return { route: "klio-local", reason: "tarefa operacional simples" };
}
