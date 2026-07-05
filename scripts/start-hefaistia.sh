#!/usr/bin/env bash
# Inicia o runtime local da Klio Hefaístia em primeiro plano. Não usa sudo,
# não mata processos, não expõe LAN — só liga o que já existe.
set -euo pipefail

HOST="${KLIO_HOST:-127.0.0.1}"
PORT="${KLIO_PORT:-4518}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Verificando se já existe algo em http://${HOST}:${PORT}/api/health ..."
if curl -sS -m 2 "http://${HOST}:${PORT}/api/health" >/dev/null 2>&1; then
  echo ""
  echo "Já existe um processo respondendo em http://${HOST}:${PORT}/api/health."
  echo "Se for a própria Hefaístia, não é preciso iniciar de novo — ver:"
  echo "  bash scripts/status-hefaistia.sh"
  echo "Se for outro processo, pare-o antes ou defina KLIO_PORT com outra porta."
  exit 1
fi

cd "$REPO_DIR"

echo "Iniciando Klio Hefaístia em http://${HOST}:${PORT} ..."
echo "(Ctrl+C para parar. Deixe este terminal aberto.)"
echo ""

if command -v bun >/dev/null 2>&1; then
  exec bun run hefaistia
fi

echo "bun não encontrado no PATH — usando 'node server/hefaistia.mjs' diretamente."
exec node server/hefaistia.mjs
