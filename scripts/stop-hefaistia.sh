#!/usr/bin/env bash
# Para o runtime local da Hefaístia com segurança: nunca usa 'killall node',
# nunca mata processo que não seja exatamente o nosso, e sempre pede
# confirmação antes de enviar qualquer sinal.
set -euo pipefail

PATTERN="server/hefaistia.mjs"

PIDS="$(pgrep -f "$PATTERN" || true)"

if [ -z "$PIDS" ]; then
  echo "Nenhum processo local da Hefaístia encontrado (padrão: '$PATTERN')."
  echo ""
  echo "Se você iniciou com 'bun run hefaistia' ou 'node server/hefaistia.mjs' em outro"
  echo "terminal, use Ctrl+C nesse terminal."
  echo "Se instalada como serviço, use: systemctl --user stop klio-hefaistia"
  exit 0
fi

echo "Processo(s) da Hefaístia encontrado(s): $PIDS"
read -r -p "Encerrar com SIGTERM? [s/N] " confirm

case "$confirm" in
  s|S|sim|Sim|SIM)
    kill $PIDS
    echo "Sinal enviado. Verifique com: bash scripts/status-hefaistia.sh"
    ;;
  *)
    echo "Nada foi encerrado."
    echo "Use Ctrl+C no terminal onde a Hefaístia está rodando, ou:"
    echo "systemctl --user stop klio-hefaistia (se instalada como serviço)."
    ;;
esac
