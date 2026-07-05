#!/usr/bin/env bash
# Verifica o status do runtime local da Klio Hefaístia sem exigir jq — usa o
# próprio Node (já necessário para o projeto) para interpretar a resposta.
set -euo pipefail

HOST="${KLIO_HOST:-127.0.0.1}"
PORT="${KLIO_PORT:-4518}"
URL="http://${HOST}:${PORT}/api/health"

echo "Consultando ${URL} ..."
echo ""

response="$(curl -sS -m 5 "$URL" 2>/dev/null || true)"

if [ -z "$response" ]; then
  echo "Hefaístia: offline"
  echo "Runtime da Hefaístia não está rodando em ${URL}."
  echo "Inicie com: bun run hefaistia"
  exit 1
fi

node -e '
const data = JSON.parse(process.argv[1]);
console.log(`Hefaístia: online (host ${data.host}, porta ${data.port})`);
console.log(`Ollama: ${data.ollama}`);
console.log(`Héstia (opcional): ${data.hestia}`);
console.log(`Kaline Fallback: ${data.kaline_fallback === "configured" ? "configurada" : "não configurada"}`);
console.log(`consultado em: ${data.timestamp}`);
' "$response"
