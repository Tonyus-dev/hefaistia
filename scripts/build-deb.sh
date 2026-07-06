#!/usr/bin/env bash
# Gera um .deb com o runtime da Hefaístia e o frontend buildado
# Falha com mensagem clara se dpkg-deb não existir; nunca usa sudo.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Extrai versão do package.json se não passada via argumento
PKG_VERSION=$(grep '"version"' "$REPO_DIR/package.json" 2>/dev/null | sed -E 's/.*"version": "(.*)",/\1/' || true)
VERSION="${1:-${PKG_VERSION:-0.1.0}}"
PKG_NAME="klio-hefaistia"
BUILD_DIR="$REPO_DIR/dist-deb"
STAGE_DIR="$BUILD_DIR/${PKG_NAME}_${VERSION}"
APP_DIR="/opt/klio-hefaistia"

echo "== Build .deb da Klio Hefaístia =="

if ! command -v dpkg-deb >/dev/null 2>&1; then
  echo "ERRO: dpkg-deb não encontrado." >&2
  echo "Instale o pacote 'dpkg-dev' (ex.: sudo apt install dpkg-dev) para gerar o .deb." >&2
  exit 1
fi

rm -rf "$STAGE_DIR"
mkdir -p \
  "$STAGE_DIR/DEBIAN" \
  "$STAGE_DIR$APP_DIR" \
  "$STAGE_DIR/usr/bin" \
  "$STAGE_DIR/usr/share/applications" \
  "$STAGE_DIR/usr/share/icons/hicolor/192x192/apps"

echo "-- executando build do frontend --"
cd "$REPO_DIR"
if command -v bun >/dev/null 2>&1; then
  bun run build
else
  npm run build
fi

echo "-- copiando frontend buildado --"
if [ -d "$REPO_DIR/dist/client" ]; then
  cp -r "$REPO_DIR/dist/client" "$STAGE_DIR$APP_DIR/dist"
elif [ -d "$REPO_DIR/dist" ]; then
  cp -r "$REPO_DIR/dist" "$STAGE_DIR$APP_DIR/dist"
elif [ -d "$REPO_DIR/.output/public" ]; then
  cp -r "$REPO_DIR/.output/public" "$STAGE_DIR$APP_DIR/dist"
else
  echo "ERRO: Pasta de build não encontrada (dist, dist/client ou .output/public)." >&2
  exit 1
fi

echo "-- copiando runtime e documentação --"
cp -r "$REPO_DIR/server" "$STAGE_DIR$APP_DIR/server"
cp -r "$REPO_DIR/knowledge" "$STAGE_DIR$APP_DIR/knowledge"
if [ -d "$REPO_DIR/docs" ]; then
  cp -r "$REPO_DIR/docs" "$STAGE_DIR$APP_DIR/docs"
fi
cp "$REPO_DIR/package.json" "$STAGE_DIR$APP_DIR/package.json"
cp "$REPO_DIR/README.md" "$STAGE_DIR$APP_DIR/README.md"

echo "-- copiando scripts executáveis --"
cp "$REPO_DIR/packaging/bin/klio-hefaistia" "$STAGE_DIR/usr/bin/klio-hefaistia"
cp "$REPO_DIR/packaging/bin/klio-hefaistia-status" "$STAGE_DIR/usr/bin/klio-hefaistia-status"
cp "$REPO_DIR/packaging/bin/klio-hefaistia-stop" "$STAGE_DIR/usr/bin/klio-hefaistia-stop"
chmod 755 "$STAGE_DIR/usr/bin/"*

echo "-- copiando desktop e ícones --"
cp "$REPO_DIR/packaging/klio-hefaistia.desktop" "$STAGE_DIR/usr/share/applications/klio-hefaistia.desktop"
cp "$REPO_DIR/public/icon-192.png" "$STAGE_DIR/usr/share/icons/hicolor/192x192/apps/klio-hefaistia.png"

cat > "$STAGE_DIR/DEBIAN/control" <<EOF
Package: $PKG_NAME
Version: $VERSION
Section: utils
Priority: optional
Architecture: all
Depends: nodejs (>= 18), curl, xdg-utils
Maintainer: Kaline Project <contato@nomosludens.ia.br>
Description: Klio Hefaístia — forja local de IA da Kaline
 Worker local que conversa com Ollama em loopback, executa tarefas técnicas,
 mede desempenho real e oferece um console visual local.
EOF

cp "$REPO_DIR/packaging/postinst" "$STAGE_DIR/DEBIAN/postinst"
cp "$REPO_DIR/packaging/prerm" "$STAGE_DIR/DEBIAN/prerm"
cp "$REPO_DIR/packaging/postrm" "$STAGE_DIR/DEBIAN/postrm"
chmod 755 "$STAGE_DIR/DEBIAN/postinst" "$STAGE_DIR/DEBIAN/prerm" "$STAGE_DIR/DEBIAN/postrm"

echo "-- empacotando --"
mkdir -p "$BUILD_DIR"
dpkg-deb --build --root-owner-group "$STAGE_DIR" "$BUILD_DIR/${PKG_NAME}_${VERSION}_all.deb"

echo ""
echo "Pacote gerado em: $BUILD_DIR/${PKG_NAME}_${VERSION}_all.deb"
