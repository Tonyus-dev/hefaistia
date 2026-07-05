# Instalabilidade — Klio Hefaístia

Este documento fecha a ambiguidade entre três modos diferentes de uso.

```txt
modo dev         → frontend 5173 + runtime 4518
modo build local → console visual + API em http://127.0.0.1:4518
.deb             → runtime-only experimental
```

## 1. Modo dev

Este é o modo completo da v1.

```bash
git clone https://github.com/Tonyus-dev/klio-hefaistia.git
cd klio-hefaistia
bun install
bun run run:local
```

O script `run:local` faz o mínimo útil:

- verifica se o runtime já está rodando em `127.0.0.1:4518`;
- inicia o runtime se necessário;
- inicia o frontend Vite em `localhost:5173`;
- não usa `sudo`;
- não expõe LAN;
- não baixa modelo automaticamente.

Se preferir dois terminais:

```bash
bun run hefaistia
bun run dev
```

## 2. Modo build local

Depois do build, o runtime serve o Console Visual e a API na mesma porta:

```bash
bun run build
bun run hefaistia
```

Abra:

```txt
http://127.0.0.1:4518
```

A API continua em `/api/*`. Se nenhum build existir em `dist/client`, `dist` ou
`.output/public` (com `index.html` ou bundle `assets/index-*.js`), `GET /` retorna uma página HTML simples dizendo para rodar
`bun run build` e depois `bun run hefaistia`. PR #8 ainda não é Tailscale: só coloca
console e API na mesma porta, sem abrir LAN.

## 3. Atalho local / PWA

O `scripts/install-local.sh` cria um atalho de menu que abre:

```txt
http://localhost:5173
```

Esse atalho não inicia processos. Ele só abre a URL do console. Antes de clicar nele,
rode:

```bash
bun run run:local
```

A home também pode ser instalada como PWA pelo navegador. Isso facilita abrir a UI,
mas ainda depende do runtime local estar rodando.

## 4. `.deb` experimental

O `.deb` é **runtime-only**.

Ele inclui:

- `server/`;
- `knowledge/`;
- `docs/`;
- `package.json`;
- service `systemd --user` opcional.

Ele não inclui:

- frontend/console visual;
- `node_modules`;
- Tauri/Electron;
- serviço habilitado automaticamente;
- atalho de menu para a UI.

Gerar pacote:

```bash
bash scripts/build-deb.sh
```

Instalar:

```bash
sudo dpkg -i dist-deb/klio-hefaistia_0.1.0_all.deb
```

Iniciar runtime manualmente:

```bash
cd /opt/klio-hefaistia
node server/hefaistia.mjs
```

Ou, opcionalmente, iniciar como serviço de usuário:

```bash
systemctl --user daemon-reload
systemctl --user start klio-hefaistia
systemctl --user enable klio-hefaistia   # opcional
```

## 5. O que ainda não existe

A Hefaístia ainda não é um app autônomo de duplo clique.

Ainda não existe:

- bundle único frontend + runtime;
- instalador finalizado;
- Tauri;
- Electron;
- serviço + UI integrados;
- Tailscale.

## 6. Regra honesta

```txt
Se você quer usar tudo: use o clone local.
Se você quer só o runtime: o .deb experimental serve.
Se você quer app autônomo: ainda não está pronto.
```
