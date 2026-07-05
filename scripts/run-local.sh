#!/usr/bin/env bash
# Sobe runtime + frontend no modo clone, sem sudo e sem expor LAN.
# É um facilitador para uso local: não transforma a Hefaístia em app standalone.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNTIME_URL="${HEFAISTIA_RUNTIME_URL:-http://127.0.0.1:4518}"
CONSOLE_URL="${HEFAISTIA_CONSOLE_URL:-http://localhost:5173}"
STARTED_RUNTIME_PID=""

cleanup() {
  if [ -n "$STARTED_RUNTIME_PID" ]; then
    echo ""
    echo "Encerrando runtime da Hefaístia iniciado por este script..."
    kill "$STARTED_RUNTIME_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

cd "$REPO_DIR"

if ! command -v bun >/dev/null 2>&1; then
  echo "ERRO: bun não encontrado no PATH. Instale bun ou use os comandos manuais." >&2
  echo "  bun install" >&2
  echo "  bun run dev" >&2
  echo "  bun run hefaistia" >&2
  exit 1
fi

echo "== Klio Hefaístia — modo local por clone =="
echo "Runtime: $RUNTIME_URL"
echo "Console: $CONSOLE_URL"
echo ""

if curl -sS -m 2 "$RUNTIME_URL/api/health" >/dev/null 2>&1; then
  echo "Runtime já está respondendo em $RUNTIME_URL — não vou iniciar outro."
else
  echo "Iniciando runtime em segundo plano..."
  bun run hefaistia &
  STARTED_RUNTIME_PID="$!"
  sleep 1
fi

echo ""
echo "Abrindo frontend Vite. Quando aparecer a URL, acesse: $CONSOLE_URL"
echo "Ctrl+C encerra o frontend e, se este script iniciou o runtime, encerra o runtime também."
echo ""

exec bun run dev
