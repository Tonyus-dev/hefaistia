#!/usr/bin/env bash
# Gera um .deb experimental com o runtime da Hefaístia (server/, knowledge/,
# docs/ e service systemd --user). Não empacota node_modules nem o frontend.
# Quem instalar usa o pacote como runtime local; o Console Visual continua vindo
# do clone/PWA até existir um bundle standalone.
# Falha com mensagem clara se dpkg-deb não existir; nunca usa sudo.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VERSION="${1:-0.1.0}"
PKG_NAME="klio-hefaistia"
BUILD_DIR="$REPO_DIR/dist-deb"
STAGE_DIR="$BUILD_DIR/${PKG_NAME}_${VERSION}"
APP_DIR="/opt/klio-hefaistia"

echo "== Build .deb experimental da Klio Hefaístia =="

if ! command -v dpkg-deb >/dev/null 2>&1; then
  echo "ERRO: dpkg-deb não encontrado." >&2
  echo "Instale o pacote 'dpkg-dev' (ex.: sudo apt install dpkg-dev) para gerar o .deb." >&2
  exit 1
fi

rm -rf "$STAGE_DIR"
mkdir -p \
  "$STAGE_DIR/DEBIAN" \
  "$STAGE_DIR$APP_DIR" \
  "$STAGE_DIR/usr/share/klio-hefaistia/icons" \
  "$STAGE_DIR/usr/lib/systemd/user"

echo "-- copiando runtime e documentação --"
cp -r "$REPO_DIR/server" "$STAGE_DIR$APP_DIR/server"
cp -r "$REPO_DIR/knowledge" "$STAGE_DIR$APP_DIR/knowledge"
cp -r "$REPO_DIR/docs" "$STAGE_DIR$APP_DIR/docs"
cp "$REPO_DIR/package.json" "$STAGE_DIR$APP_DIR/package.json"
cp "$REPO_DIR/README.md" "$STAGE_DIR$APP_DIR/README.md"
[ -f "$REPO_DIR/bun.lock" ] && cp "$REPO_DIR/bun.lock" "$STAGE_DIR$APP_DIR/bun.lock"
[ -f "$REPO_DIR/.env.example" ] && cp "$REPO_DIR/.env.example" "$STAGE_DIR$APP_DIR/.env.example"

cp "$REPO_DIR/public/icon-192.png" "$STAGE_DIR/usr/share/klio-hefaistia/icons/klio-hefaistia.png"

sed "s#__APP_DIR__#$APP_DIR#g" "$REPO_DIR/packaging/klio-hefaistia.service" \
  > "$STAGE_DIR/usr/lib/systemd/user/klio-hefaistia.service"

cat > "$STAGE_DIR/DEBIAN/control" <<EOF
Package: $PKG_NAME
Version: $VERSION
Section: utils
Priority: optional
Architecture: all
Depends: nodejs (>= 18)
Maintainer: Kaline Project <noreply@example.com>
Description: Klio Hefaístia — worker local de IA da Kaline (runtime experimental)
 Runtime local que fala com o Ollama e, opcionalmente, com a Kaline
 Fallback via OpenRouter. Pacote experimental runtime-only — ver README
 para limitacoes conhecidas (nao inclui o frontend/console visual).
EOF

cp "$REPO_DIR/packaging/postinst" "$STAGE_DIR/DEBIAN/postinst"
cp "$REPO_DIR/packaging/prerm" "$STAGE_DIR/DEBIAN/prerm"
chmod 755 "$STAGE_DIR/DEBIAN/postinst" "$STAGE_DIR/DEBIAN/prerm"

echo "-- empacotando --"
mkdir -p "$BUILD_DIR"
dpkg-deb --build --root-owner-group "$STAGE_DIR" "$BUILD_DIR/${PKG_NAME}_${VERSION}_all.deb"

echo ""
echo "Pacote experimental gerado em: $BUILD_DIR/${PKG_NAME}_${VERSION}_all.deb"
echo "Este .deb é runtime-only: empacota server/ + knowledge/ + docs/."
echo "Ele NÃO instala o Console Visual nem cria atalho de menu para a UI."
echo "O Console Visual continua rodando via clone/PWA: bun run dev."
echo "Revise antes de instalar em outra máquina."
