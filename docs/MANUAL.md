# Manual — Klio Hefaístia

Instalação, uso e compilação do worker local de IA da Kaline. Este manual
complementa o `README.md` (que tem o detalhe de cada endpoint e variável) com um
passo a passo mais linear, do zero ao uso diário.

```txt
Klio Local guia.
Kaline Fallback ilumina.
Hefaístia executa.
Totalidade sedimenta.
Ká cola e aprova.
```

---

## 1. Pré-requisitos

- **Node.js** 18+ (ou o runtime compatível já usado pelo `bun`).
- **Bun** ([bun.sh](https://bun.sh)) — recomendado. `npm`/`node` puro funcionam como
  alternativa, mas os comandos deste manual usam `bun`.
- **Ollama** ([ollama.com](https://ollama.com)) instalado e com pelo menos um
  modelo puxado — é o motor de inferência local. A Hefaístia **não instala nem
  baixa o Ollama sozinha**.
- Opcional: **OpenRouter** (uma conta e uma API key) se você quiser usar a Kaline
  Fallback para tarefas complexas. Sem isso, a Hefaístia funciona normalmente —
  só o fallback fica indisponível.
- Opcional: **Héstia Station** (projeto separado, `Tonyus-dev/hestia`) rodando em
  `127.0.0.1:4517` — puramente informativo, nunca obrigatório.

Nada disso exige root, exceto a instalação do próprio Ollama (que segue as
instruções oficiais dele) e, se você optar, a instalação de um `.deb` do sistema
(`sudo dpkg -i ...`).

---

## 2. Instalação

### 2.1. Clonar e instalar dependências

```bash
git clone <url-do-repo> klio-hefaistia
cd klio-hefaistia
bun install
```

Alternativa sem `bun`:

```bash
npm install
```

### 2.2. Instalar o Ollama e puxar um modelo

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama serve                      # se não iniciar sozinho
ollama pull qwen2.5:0.5b          # modelo pequeno da Klio Local
ollama pull qwen2.5-coder:7b      # modelo usado por padrão em /api/tasks e benchmark
```

A Hefaístia nunca faz esse pull sozinha em segundo plano — mas, uma vez com o
console aberto, você também pode puxar um modelo pela própria UI (painel
**Modelos → Puxar modelo**, ver seção 4.4).

### 2.3. Instalar o atalho de menu (opcional, modo pessoal)

```bash
bash scripts/install-local.sh
```

Sem `root`. Cria um atalho `.desktop` em `~/.local/share/applications` que abre o
console visual no navegador (`http://localhost:5173`). O atalho **não inicia** o
frontend nem o runtime — eles precisam estar rodando (ver seção 3).

### 2.4. `.deb` experimental (opcional)

```bash
bash scripts/build-deb.sh
sudo dpkg -i dist-deb/klio-hefaistia_0.1.0_all.deb
```

Empacota só o **runtime** (`server/` + `knowledge/`). Não inclui o frontend/console
visual — isso continua rodando via `bun run dev` a partir do clone. Ver limitações
na seção 6.

---

## 3. Rodando (modo dia a dia)

A Hefaístia é sempre **dois processos**: o frontend (console visual) e o runtime
(fala com o Ollama). Em dois terminais:

```bash
# terminal 1 — frontend
bun run dev
# → http://localhost:5173

# terminal 2 — runtime
bun run hefaistia
# → http://127.0.0.1:4518
```

Ou, com os scripts de conveniência do PR 5:

```bash
bash scripts/start-hefaistia.sh   # inicia o runtime (detecta se já está rodando)
bash scripts/status-hefaistia.sh # mostra status legível, sem abrir navegador
bash scripts/stop-hefaistia.sh   # para o runtime (pede confirmação, nunca killall)
```

Abra `http://localhost:5173` — a home já é o Console Visual da Forja. Não pede
login. Funciona instalada como PWA (ícone de instalar no navegador ou "Adicionar à
tela inicial").

Se o runtime não estiver rodando, o console mostra um card "A Forja local ainda
não está ligada" com o comando `bun run hefaistia` copiável — nunca finge que algo
está funcionando quando não está.

---

## 4. Usando o console

### 4.1. Status e configurações

O painel **Status** mostra Hefaístia/Ollama/Héstia (online/offline), se a Kaline
Fallback está configurada, quantos arquivos de `knowledge/` foram carregados e o
modelo selecionado. Botão **Atualizar** força uma nova consulta — não há
auto-poll agressivo.

O painel **Configurações** permite trocar a API URL e o token local (persistidos
em `localStorage`, nunca no servidor). Padrão: `http://127.0.0.1:4518` /
`dev-local`. Botão **Testar conexão** e **Restaurar padrão**.

### 4.2. Knowledge

O painel **Knowledge** lista os arquivos `.md` carregados de `knowledge/` (na raiz
do repo) e seus tamanhos — é o que dirige a Klio Local. Editar/criar um `.md`
nesse diretório e clicar em **Atualizar** já reflete a mudança; a UI não edita
esses arquivos.

### 4.3. Conversar — três modos

O painel **Conversar** tem três abas:

- **Klio Local** — modelo pequeno via Ollama, guiado pelo `knowledge/`. Escolha um
  modo (`operational`, `explain_error`, `prepare_prompt`, `review_next_step`,
  `terminal_guide`), escreva a mensagem e envie.
- **Kaline Fallback** — modelo forte via OpenRouter, só quando configurado no
  runtime (`OPENROUTER_API_KEY`). A UI nunca pede essa chave — se não estiver
  configurada, mostra um aviso claro em vez de travar.
- **Auto** — a Hefaístia decide entre os dois por heurística (palavras-chave como
  "arquitetura", tamanho da mensagem, ou preferência explícita) e mostra a rota +
  o motivo escolhidos.

### 4.4. Modelos e benchmark

O painel **Modelos** lista o que já está instalado/carregado no Ollama e permite
selecionar um modelo (usado pelo chat e pelo benchmark). Se o Ollama estiver
offline, mostra o comando oficial de instalação (copiável, nunca executado pela
UI). A seção **Puxar modelo** baixa um modelo do Ollama por ação explícita — é um
download real (pode ser vários GB); a Hefaístia nunca baixa nada sozinha.

O painel **Benchmark** roda um prompt fixo e mostra `tokens_per_second` real
(nunca inventado — se o Ollama não retornar métrica suficiente, a UI diz isso
em vez de estimar).

### 4.5. Export diário e ponte com a Totalidade

O painel de export tem duas abas:

- **Diário** — resumo, decisões, problemas, próximos passos, observações — gera
  um Markdown genérico para arquivo/registro pessoal.
- **Totalidade** — um formato específico pensado para colar na Kaline Totalidade
  (tipo sugerido, o que aconteceu, decisões confirmadas, preferências observadas,
  estado técnico, próximos passos). Botão **Copiar bloco**.

Em ambos os casos: **nada é salvo em disco nem enviado automaticamente**. Ká
revisa e cola manualmente onde quiser sedimentar.

### 4.6. Sessões de trabalho

O painel **Sessão de trabalho** tem um campo de título opcional e o botão **Nova
sessão** — cria uma pasta em `sessions/<data>-<título>/` com um `metadata.json`
(data, título). Só acontece quando você clica no botão; a Hefaístia nunca cria
pastas sozinha. É um espaço em branco para você guardar o que quiser da sessão
(anotações, exports salvos manualmente) — `sessions/` está no `.gitignore`.

### 4.7. Histórico

Até 30 interações recentes ficam em `localStorage` (sem token, sem chave
OpenRouter, sem anexos). Botão **Limpar histórico**.

---

## 5. Compilação e verificação

```bash
bun run typecheck   # tsc --noEmit
bun run lint        # eslint .
bun run format      # prettier --write . (ou format:check para só checar)
bun run test        # vitest run
```

Build de produção do frontend (herdado da Kaline Totalidade — TanStack Start /
Cloudflare Workers):

```bash
bun run build       # build de produção
bun run build:dev   # build em modo development
bun run preview     # preview local do build
bun run start       # roda o build via serve.mjs (adaptador Node)
```

O runtime da Hefaístia (`server/hefaistia.mjs`) é Node puro — não passa por esse
pipeline de build; roda direto com `node`/`bun`:

```bash
bun run hefaistia       # roda uma vez
bun run dev:hefaistia   # roda com --watch, reinicia ao salvar
```

---

## 6. Limitações honestas

- A Hefaístia **não é um app autônomo** (tipo Tauri/Electron): sempre depende de
  dois processos rodando (frontend + runtime).
- O `.deb` experimental empacota só o runtime — o frontend continua rodando via
  `bun run dev` a partir de um clone.
- Os ícones do PWA (`public/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`)
  são o mesmo PNG de 180×180 reaproveitado — não há ferramenta de imagem
  disponível para gerar tamanhos reais neste momento.
- Puxar modelo pela UI é uma chamada bloqueante, sem barra de progresso.
- A ponte com a Kaline Totalidade é manual/assistida — nunca escreve
  automaticamente na Totalidade, nunca usa Supabase, nunca sincroniza sozinha.
- Acesso remoto/rede privada (Tailscale) ainda não existe — está fora do escopo
  da v1 (ver `README.md`, roadmap).

---

## 7. Onde ler mais

- `README.md` — referência completa de endpoints, variáveis de ambiente e
  exemplos `curl`.
- `knowledge/*.md` — os marcos que dirigem a Klio Local.
- `server/hefaistia.mjs` e `server/lib/*.mjs` — o runtime.
- `src/components/hefaistia/*` — o console visual.
