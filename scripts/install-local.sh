#!/usr/bin/env bash
# Instalação local simples, para uso pessoal — sem root, sem alterar o
# sistema inteiro, sem expor LAN, sem baixar modelo do Ollama sozinho.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONSOLE_URL="${HEFAISTIA_CONSOLE_URL:-http://localhost:5173}"
ICON_PATH="$REPO_DIR/public/icon-192.png"

echo "== Instalação local da Klio Hefaístia (modo pessoal, sem root) =="
echo "Repositório: $REPO_DIR"
echo "Console: $CONSOLE_URL"
echo ""

cd "$REPO_DIR"

if command -v bun >/dev/null 2>&1; then
  echo "-- bun install --"
  bun install
else
  echo "bun não encontrado no PATH. Instale bun (https://bun.sh) ou rode 'npm install' manualmente."
fi

APPS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
mkdir -p "$APPS_DIR"

DESKTOP_SRC="$REPO_DIR/packaging/klio-hefaistia.desktop"
DESKTOP_DEST="$APPS_DIR/klio-hefaistia.desktop"

sed \
  -e "s#__CONSOLE_URL__#$CONSOLE_URL#g" \
  -e "s#__ICON_PATH__#$ICON_PATH#g" \
  "$DESKTOP_SRC" > "$DESKTOP_DEST"
chmod +x "$DESKTOP_DEST"

echo ""
echo "Atalho criado em: $DESKTOP_DEST"
echo "Ele abre o navegador em $CONSOLE_URL — o Console Visual da Forja."
echo ""
echo "IMPORTANTE — o atalho só abre a URL. Para ligar tudo em modo clone:"
echo "  bun run run:local"
echo ""
echo "Ou, em dois terminais:"
echo "  1) bun run dev        (frontend em http://localhost:5173)"
echo "  2) bun run hefaistia  (runtime em http://127.0.0.1:4518)"
echo ""
echo "Verifique o status a qualquer momento com: bash scripts/status-hefaistia.sh"
echo ""
echo "Serviço systemd --user é opcional — ver packaging/klio-hefaistia.service e o README."
echo "Nenhum modelo do Ollama foi baixado. Nada aqui expõe a Hefaístia em rede (LAN);"
echo "tudo continua em 127.0.0.1."
