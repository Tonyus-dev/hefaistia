# Klio Hefaístia

Worker local de IA do ecossistema Kaline.

## O que é

A Klio Hefaístia nasceu como clone do repositório da **Kaline Totalidade**, mantendo a
identidade visual e a ontologia Kaline/Klio, mas seguindo um destino próprio: ela não é
uma nova Kaline, não é um chat autônomo e não é uma cópia funcional da Totalidade.

Ela será uma **forja local**: recebe tarefas estruturadas, executa modelos via
[Ollama](https://ollama.com) na máquina local, mede desempenho real (tokens/s, duração)
e devolve resultado bruto para quem pediu.

```txt
Kaline decide.
Klio organiza.
Hefaístia executa.
Ollama gera.
Héstia observa.
```

## Status

- **PR 1 — fundação:** converteu o clone em base local (home sem login/Supabase,
  identidade visual preservada, contratos mínimos em `src/lib/hefaistia/`).
- **PR 2 — motor local Ollama:** a Hefaístia ganhou um runtime Node próprio em
  `server/hefaistia.mjs`, rodando em `http://127.0.0.1:4518`, que fala com o Ollama
  local e executa tarefas/benchmarks reais.
- **PR 3 — Klio Local dirigida + fallback Kaline + export diário:** a Hefaístia
  ganhou uma camada de roteamento: decide entre consultar a **Klio Local** (modelo
  pequeno via Ollama, dirigido por `knowledge/*.md`) ou pedir um **fallback Kaline**
  (OpenRouter, só quando necessário) e sabe gerar um contexto diário em Markdown para
  colar manualmente na Kaline Totalidade.
- **PR 4 — Console Visual da Forja:** interface local em
  `src/components/hefaistia/` para operar tudo isso sem terminal — status,
  knowledge, modelos, benchmark, os três modos de conversa (Klio Local, Kaline
  Fallback, Auto) e o export diário, com histórico leve em `localStorage`.
- **PR 5 — app instalável + operabilidade sem terminal:** scripts (`scripts/*.sh`)
  para iniciar/parar/verificar status, atalho `.desktop`, serviço `systemd --user`
  opcional e um `.deb` experimental (`scripts/build-deb.sh`); card "A Forja local
  ainda não está ligada" e puxar modelo do Ollama pela UI (download real, sempre
  por ação explícita); a home já é um PWA instalável.
- **PR 6 — poda final + ponte assistida com Totalidade (este PR):** fecha a v1.
  Remove código/dependências claramente mortas do clone original (17 componentes
  `ui/*` sem uso, `react-hook-form`, `@hookform/resolvers`, `date-fns`) e adiciona
  um **Bloco para Totalidade** — formato Markdown específico (tipo sugerido,
  o que aconteceu, decisões confirmadas, preferências observadas, estado técnico,
  próximos passos) via `POST /api/context/export-totalidade`, sempre manual/
  assistido. Também adiciona sessões de trabalho (`POST /api/sessions`, pasta +
  `metadata.json`, só por ação explícita).

Este PR **não** inclui: Monaco Editor, Tauri, ponte automática com a Totalidade,
escrita direta na Totalidade, Supabase, banco de dados, login, upload de arquivos,
leitura de arquivos locais, execução de shell pela UI, edição visual dos arquivos
`knowledge/*.md` ou sync automático.

## Roadmap

Com o PR 6, a v1 da Klio Hefaístia está fechada: app local utilizável por Ká, com
runtime próprio, console visual, Klio Local, Kaline Fallback, export diário/bloco
Totalidade e instalação simples — sem terminal no uso cotidiano, com ponte manual/
assistida para a Totalidade.

- **PR 7** — Tailscale / acesso seguro pela rede privada (acesso de outro aparelho
  confiável dentro da tailnet, sem expor a Hefaístia à internet pública).

## Portas locais

```txt
Klio Hefaístia    → http://127.0.0.1:4518   (runtime ativo desde o PR 2)
Ollama            → http://127.0.0.1:11434  (motor local de inferência)
Héstia Station    → http://127.0.0.1:4517   (projeto separado, opcional)
```

A **Héstia** é um app independente (repo `Tonyus-dev/hestia`) que monitora o corpo
físico da estação (hardware, storage, serviços, logs). A Hefaístia pode futuramente
consultá-la para telemetria, mas nunca depende dela para funcionar — se a Héstia estiver
offline, a Hefaístia continua operando normalmente.

A integração com a **Kaline Totalidade** é e continua sendo **manual/assistida**
(ver seção do PR 6) — a Hefaístia nunca escreve na Totalidade automaticamente. O
contexto sai como Markdown copiável (export diário ou bloco Totalidade, ver
`/api/context/export-daily` e `/api/context/export-totalidade` abaixo) para o
usuário colar manualmente.

## Superfície atual da Hefaístia

A Hefaístia expõe apenas:

- `/` — Console Visual da Forja.
- Runtime local em `server/hefaistia.mjs`.
- API local própria em `http://127.0.0.1:4518/api/*`.

Rotas herdadas da Kaline Totalidade foram removidas deste app para reduzir peso,
risco e confusão conceitual.

A Hefaístia não é a Totalidade, não tem login próprio e não escreve na memória
canônica. A ponte continua manual: exporta Markdown para Ká copiar e aprovar.

## Rodando localmente

```bash
# recomendado
bun install
bun run dev

# alternativa
npm install
npm run dev
```

Isso deve abrir `/` mostrando a home da Klio Hefaístia, sem exigir login e sem chamar
Supabase, OpenRouter ou Ollama.

## Runtime local (PR 2 + PR 3 + PR 4 + PR 5 + PR 6)

Há três modos de uso:

```txt
modo dev:
bun run run:local
→ frontend 5173 + runtime 4518

modo build local:
bun run build
bun run hefaistia
→ console visual e API em http://127.0.0.1:4518

modo .deb:
.deb instalável local com runtime + console visual buildado + launcher de menu
```

No modo dev, o frontend (`bun run dev`) e o runtime da Hefaístia (`bun run hefaistia`)
são dois processos separados. No modo build local, o runtime serve a API em `/api/*`
e os arquivos estáticos do Console Visual da Forja na mesma origem. PR #8 ainda não
é Tailscale: só coloca console e API na mesma porta, sem abrir LAN.

### Variáveis de ambiente

Todas têm fallback seguro; nenhuma é obrigatória para rodar em loopback.

```txt
KLIO_HOST=127.0.0.1
KLIO_PORT=4518
KLIO_TOKEN=dev-local
KLIO_ALLOW_LAN=0
OLLAMA_URL=http://127.0.0.1:11434
DEFAULT_MODEL=qwen2.5-coder:7b
HESTIA_URL=http://127.0.0.1:4517

# Klio Local (PR 3) — modelo pequeno local
KLIO_LOCAL_MODEL=qwen2.5:0.5b

# Kaline Fallback (PR 3) — OpenRouter, opcional
OPENROUTER_API_KEY=
KALINE_FALLBACK_MODEL=google/gemini-2.5-flash
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Export diário (PR 3)
KALINE_CONTEXT_EXPORT_MAX_ITEMS=30

# Puxar modelo pela UI (PR 5) — download real, pode ser lento
KLIO_PULL_TIMEOUT_MS=1800000
```

Notas:

- `KLIO_LOCAL_MODEL` pode ser qualquer modelo pequeno já puxado no Ollama
  (`qwen2.5:0.5b`, `llama3.2:1b`, `gemma3:1b`...). A Hefaístia **não baixa modelo
  automaticamente** — se o modelo não existir localmente, o Ollama responde com erro
  e a Hefaístia repassa esse erro sem inventar nada.
- Sem `OPENROUTER_API_KEY`, `/api/kaline/fallback` e a rota de `/api/route-task` que
  cair em `kaline-fallback` respondem `503 KALINE_FALLBACK_NOT_CONFIGURED` — o
  servidor continua funcionando normalmente, só o fallback fica indisponível.
- `OPENROUTER_API_KEY` nunca é logada, nunca aparece em resposta JSON e nunca deve ir
  para o frontend.
- O servidor sempre binda em `KLIO_HOST` (padrão `127.0.0.1`). Se `KLIO_HOST` não for
  loopback e `KLIO_ALLOW_LAN` não for `"1"`, o processo recusa iniciar.
- Todas as rotas exigem `Authorization: Bearer <KLIO_TOKEN>`, exceto `GET /api/health`.
- CORS é restrito a loopback: o runtime só responde com
  `Access-Control-Allow-Origin` quando a requisição vem de uma origem
  `http://127.0.0.1:*` ou `http://localhost:*` (nunca `*`) — necessário no modo dev,
  em que o Console Visual roda em outra porta (a do Vite, tipicamente 5173).
- No modo build local, `server/hefaistia.mjs` procura `dist/client`, `dist` e
  `.output/public`, nessa ordem, usando o primeiro diretório com `index.html` (ou, no build TanStack atual, um bundle `assets/index-*.js` para montar um shell HTML mínimo). Se
  nada existir, `GET /` mostra uma página HTML com `bun run build` e
  `bun run hefaistia`.

### Como iniciar

```bash
bun run hefaistia       # roda uma vez
bun run dev:hefaistia   # roda com --watch, reinicia ao salvar
bun run hefaistia:build # builda o console e inicia tudo em http://127.0.0.1:4518
```

O terminal deve mostrar algo como:

```txt
[hefaistia] Klio Hefaístia ouvindo em http://127.0.0.1:4518
[hefaistia] Ollama esperado em http://127.0.0.1:11434
[hefaistia] Héstia (opcional) esperada em http://127.0.0.1:4517
```

### Endpoints — PR 2 (Ollama MVP)

| Rota                     | Auth | Descrição                                                                             |
| ------------------------ | ---- | ------------------------------------------------------------------------------------- |
| `GET /api/health`        | não  | saúde da Hefaístia + status de Ollama/Héstia                                          |
| `GET /api/models`        | sim  | proxy para `GET {OLLAMA_URL}/api/tags`                                                |
| `GET /api/models/loaded` | sim  | proxy para `GET {OLLAMA_URL}/api/ps`                                                  |
| `POST /api/models/pull`  | sim  | (PR 5) baixa um modelo via `{OLLAMA_URL}/api/pull` — só por ação explícita do usuário |
| `POST /api/benchmark`    | sim  | roda `{OLLAMA_URL}/api/generate` com prompt fixo e mede tokens/s                      |
| `POST /api/tasks`        | sim  | monta a tarefa estruturada, chama `{OLLAMA_URL}/api/chat` e devolve resultado bruto   |

### Endpoints — PR 3 (Klio Local + Kaline Fallback + export diário)

| Rota                             | Auth | Descrição                                                             |
| -------------------------------- | ---- | --------------------------------------------------------------------- |
| `GET /api/knowledge`             | sim  | lista os marcos carregados de `knowledge/*.md` (arquivo + tamanho)    |
| `POST /api/klio/chat`            | sim  | consulta a Klio Local (Ollama) com prompt dirigido + knowledge        |
| `POST /api/kaline/fallback`      | sim  | consulta a Kaline Fallback via OpenRouter (só se configurado)         |
| `POST /api/route-task`           | sim  | decide por heurística entre Klio Local e Kaline Fallback e já executa |
| `POST /api/context/export-daily` | sim  | gera o contexto diário em Markdown (não escreve em disco)             |

### Endpoints — PR 6 (ponte assistida + sessões)

| Rota                                  | Auth | Descrição                                                                                                         |
| ------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------- |
| `POST /api/context/export-totalidade` | sim  | gera o **Bloco para Totalidade** em Markdown (não escreve em disco, não chama a Totalidade, não exige OpenRouter) |
| `POST /api/sessions`                  | sim  | cria uma pasta em `sessions/<data>-<slug>/` com `metadata.json` — só por ação explícita, nunca automático         |

Erros seguem o formato `{ ok: false, error, code, detail? }` na maioria das rotas, ou
`{ status: "error", code, message, warnings }` (`/api/tasks`), com códigos como
`UNAUTHORIZED`, `BAD_JSON`, `BAD_REQUEST`, `OLLAMA_OFFLINE`, `OLLAMA_ERROR`,
`KALINE_FALLBACK_NOT_CONFIGURED`, `KALINE_FALLBACK_ERROR`, `KNOWLEDGE_NOT_FOUND`,
`KNOWLEDGE_TOO_LARGE`, `METHOD_NOT_ALLOWED`, `BODY_TOO_LARGE`, `NOT_FOUND`,
`LAN_DISABLED`, `INTERNAL_ERROR`.

### O que é Klio Local

Klio Local é uma camada operacional **pequena**, rodando via Ollama, dirigida pelos
marcos em `knowledge/*.md`. Ela guia passos simples (explicar erro, preparar prompt,
próximo passo), não decide tarefas críticas sozinha e recomenda fallback Kaline quando
a tarefa é grande. Ver `knowledge/marco-klio-local.md`.

### Klio Local vs. Kaline Fallback vs. Totalidade

```txt
Klio Local
→ modelo pequeno local via Ollama, direto e barato, guia passos simples

Kaline Fallback
→ modelo forte via OpenRouter, chamado só quando necessário/explícito

Kaline Totalidade
→ app canônico, memória/sedimentação principal, recebe contexto colado manualmente
```

```txt
Klio Local guia.
Kaline Fallback ilumina.
Hefaístia executa.
Totalidade sedimenta.
Ká cola e aprova.
```

### Como criar/editar `knowledge/*.md`

O diretório `knowledge/` na raiz do repo contém marcos simples em Markdown,
versionados junto do código:

```txt
knowledge/
├─ marco-klio-local.md
├─ modo-ponytail.md
├─ limites-operacionais.md
└─ export-diario-template.md
```

Basta editar ou adicionar um `.md` novo nesse diretório — o runtime lê todos os
arquivos `.md` diretamente dentro de `knowledge/` (sem subpastas, sem paths vindos de
requisição) a cada chamada. Se o diretório não existir, a Hefaístia segue com contexto
vazio e um warning, sem falhar. O conteúdo combinado é truncado em
`MAX_KNOWLEDGE_CHARS` (24000 por padrão) para não estourar o prompt da Klio Local.

### Exemplos `curl` — PR 2

```bash
curl http://127.0.0.1:4518/api/health
```

```bash
curl -H "Authorization: Bearer dev-local" \
  http://127.0.0.1:4518/api/models
```

```bash
curl -X POST http://127.0.0.1:4518/api/benchmark \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-local" \
  -d '{"model":"qwen2.5-coder:7b"}'
```

```bash
curl -X POST http://127.0.0.1:4518/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-local" \
  -d '{
    "source": "manual",
    "target": "klio-hefaistia",
    "task_type": "analyze_code",
    "model_hint": "qwen2.5-coder:7b",
    "context": {
      "user_goal": "verificar se há problema",
      "code": "console.log(\"oi\")",
      "constraints": ["patch mínimo", "não inventar dependências"]
    },
    "expected_output": {
      "format": "structured_markdown",
      "sections": ["diagnóstico", "patch mínimo", "riscos"]
    }
  }'
```

### Exemplos `curl` — PR 3

Ver knowledge:

```bash
curl -H "Authorization: Bearer dev-local" \
  http://127.0.0.1:4518/api/knowledge
```

Chamar Klio Local:

```bash
curl -X POST http://127.0.0.1:4518/api/klio/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-local" \
  -d '{
    "message": "Explique este erro como próximo passo simples",
    "mode": "explain_error"
  }'
```

Chamar Kaline Fallback:

```bash
curl -X POST http://127.0.0.1:4518/api/kaline/fallback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-local" \
  -d '{
    "message": "Analise esta arquitetura de PR",
    "reason": "tarefa arquitetural complexa"
  }'
```

Roteamento automático:

```bash
curl -X POST http://127.0.0.1:4518/api/route-task \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-local" \
  -d '{
    "message": "não entendi esse erro do terminal",
    "prefer": "auto",
    "mode": "terminal_guide"
  }'
```

Export diário:

```bash
curl -X POST http://127.0.0.1:4518/api/context/export-daily \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-local" \
  -d '{
    "summary": "Hoje testamos a Hefaístia local.",
    "decisions": ["Klio Local será pequena e dirigida"],
    "problems": ["Ainda não há UI final"],
    "next_steps": ["Criar console visual"],
    "notes_for_totalidade": ["Ká quer evitar terminal profundo"]
  }'
```

A resposta traz `filename` e `markdown` prontos para copiar e colar manualmente na
Kaline Totalidade — **nada é salvo em disco nem enviado automaticamente**.

### Testando com Ollama desligado

Com o Ollama parado: `GET /api/health` continua respondendo `200` com
`"ollama": "offline"`; `/api/models`, `/api/benchmark`, `/api/tasks` e
`/api/klio/chat` respondem `502 OLLAMA_OFFLINE`; `/api/knowledge` e
`/api/context/export-daily` funcionam normalmente (não dependem do Ollama);
`/api/route-task` com rota `klio-local` propaga o mesmo erro `OLLAMA_OFFLINE` —
nenhuma métrica é inventada.

### Testando com Ollama ligado

Com `ollama serve` rodando e um modelo puxado (`ollama pull qwen2.5-coder:7b`,
`ollama pull qwen2.5:0.5b`): `/api/models` lista modelos reais; `/api/benchmark` e
`/api/tasks` retornam `tokens_per_second` calculado a partir de `eval_count`/
`eval_duration` reais; `/api/klio/chat` responde com o modelo pequeno local;
`/api/route-task` em tarefa simples usa `klio-local` e devolve resposta real.

### Testando sem `OPENROUTER_API_KEY`

`/api/kaline/fallback` responde `503 KALINE_FALLBACK_NOT_CONFIGURED` sem quebrar o
servidor. `/api/route-task` em tarefa complexa (ex.: menciona "arquitetura",
"integração com Totalidade", "Supabase"...) responde o mesmo erro com uma sugestão
(`Use prefer='local' ou configure OPENROUTER_API_KEY.`). A chave nunca aparece em log
nem em resposta.

### Testando com `OPENROUTER_API_KEY` configurada

`/api/kaline/fallback` retorna a resposta real da Kaline Fallback (`KALINE_FALLBACK_MODEL`,
padrão `google/gemini-2.5-flash`). `/api/route-task` em tarefa arquitetural complexa usa
`kaline-fallback` automaticamente.

## Console Visual da Forja (PR 4)

Interface local para operar a Hefaístia sem terminal, em
`src/components/hefaistia/` (montada em `/` via `HefaistiaHome` →
`HefaistiaConsole`). Consome a mesma API do runtime local descrita acima através de
`src/lib/hefaistia/client.ts`.

### Como abrir

Modo dev:

```bash
bun run run:local
```

Abra `http://localhost:5173` — a home já é o console.

Modo build local:

```bash
bun run build
bun run hefaistia
```

Abra `http://127.0.0.1:4518` — o runtime serve o console buildado e mantém a API em
`/api/*`. Sem build, `/` responde uma página HTML simples instruindo a rodar
`bun run build` e depois `bun run hefaistia`. Sem login, sem redirecionamento.

### Configurar API URL e token

A `SettingsPanel` (coluna esquerda) permite trocar a API URL e o token local sem
reiniciar nada — os valores ficam em `localStorage` (`hefaistia_api_url`,
`hefaistia_token`, `hefaistia_selected_model`). O default é
`http://127.0.0.1:4518` / `dev-local`, igual ao runtime. O botão **Restaurar
padrão** volta a esses valores; **Testar conexão** dispara um `GET /api/health` e
mostra o resultado inline. O token local não é uma senha de internet — é só a
proteção do runtime rodando na própria máquina.

### Usar Klio Local, Kaline Fallback e Auto

A `ChatPanel` (coluna direita) tem três abas:

- **Klio Local** — mensagem + modo (`operational`, `explain_error`,
  `prepare_prompt`, `review_next_step`, `terminal_guide`) + modelo local opcional →
  `POST /api/klio/chat`.
- **Kaline Fallback** — mensagem + motivo do fallback → `POST /api/kaline/fallback`.
  A UI nunca pede a chave OpenRouter; se ela não estiver configurada no runtime, a
  resposta mostra o aviso "Kaline Fallback não está configurada..." em vez de travar.
- **Auto** — mensagem + preferência (`auto`/`local`/`kaline`) → `POST /api/route-task`.
  O resultado mostra a rota escolhida e o motivo (ex.: `kaline-fallback` — "mensagem
  contém termo \"arquitetura\"").

Todo resultado tem botão **Copiar resultado**.

### Gerar o export diário

A `DailyExportPanel` tem um campo por seção (resumo, decisões, problemas, próximos
passos, observações para a Totalidade — uma linha por item). O botão **Gerar
contexto diário** chama `POST /api/context/export-daily` e mostra o `filename` e o
Markdown gerado, com botão **Copiar Markdown**. Nada é salvo em disco nem enviado
para a Totalidade — o aviso fica sempre visível: revise, copie e cole manualmente.

### Estados offline

A UI nunca finge que uma integração está funcionando:

| Situação                     | O que a UI mostra                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| Runtime da Hefaístia offline | "Runtime da Hefaístia não está rodando em `<url>`." + comando copiável `bun run hefaistia` |
| Token errado                 | "Token local recusado. Confira o valor de `KLIO_TOKEN` no runtime."                        |
| Ollama offline               | "Ollama está offline. A Klio Local precisa do Ollama para responder."                      |
| OpenRouter não configurado   | "Kaline Fallback não está configurada. Configure `OPENROUTER_API_KEY` no runtime local."   |
| Héstia offline               | "Héstia está offline ou indisponível. Isso é opcional e não bloqueia a Hefaístia."         |

### Histórico local

A `HistoryPanel` mostra até 30 interações recentes (`klio-local`, `kaline-fallback`,
`route-task`, `benchmark`, `daily-export`), guardadas em `localStorage`
(`hefaistia_history`) — sem token, sem chave OpenRouter, sem anexos, sem IndexedDB.
Botão **Limpar histórico** apaga tudo.

### Compatibilidade indispensável: CORS e CSP loopback

O Console roda em uma origem diferente do runtime (porta do Vite vs. `4518`), então
foi indispensável abrir duas portas mínimas de compatibilidade, ambas restritas a
loopback:

- **`server/hefaistia.mjs`** ganhou CORS restrito: só responde
  `Access-Control-Allow-Origin` quando a origem da requisição é
  `http://127.0.0.1:*` ou `http://localhost:*` (nunca `*`), e responde ao preflight
  `OPTIONS` antes de checar token — sem isso, o navegador bloqueava toda resposta
  por CORS mesmo com o runtime respondendo normalmente.
- **`src/server.ts`** e **`src/lib/csp.ts`** (Content-Security-Policy do frontend)
  passaram a permitir `connect-src` para `http://127.0.0.1:*` e `http://localhost:*`
  — sem isso, o navegador recusava até abrir a conexão com o runtime local.

Nenhuma outra mudança foi feita nesses arquivos.

## App instalável e operabilidade sem terminal (PR 5)

Objetivo: a Hefaístia deixar de parecer projeto de terminal. Ainda depende de dois
processos rodando (frontend + runtime) — **ela não é um app autônomo tipo
Tauri/Electron** — mas agora tem scripts, atalho de menu, PWA instalável e um
empacotamento `.deb` experimental.

### Modo desenvolvimento vs. modo uso local

```bash
# modo desenvolvimento (o que já existia)
bun install
bun run dev         # frontend em http://localhost:5173
bun run hefaistia    # runtime em http://127.0.0.1:4518

# modo uso local (PR 5) — mesma coisa, com scripts de conveniência
bash scripts/install-local.sh    # bun install + atalho .desktop
bash scripts/start-hefaistia.sh  # inicia o runtime (detecta se já está rodando)
bash scripts/status-hefaistia.sh # mostra status legível
bash scripts/stop-hefaistia.sh   # para o runtime (pede confirmação, nunca killall)
```

O frontend (`bun run dev`) continua sendo o único jeito de abrir o console visual
neste PR — não há build estático/standalone ainda.

### Scripts (`scripts/`)

| Script                | O que faz                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `start-hefaistia.sh`  | Detecta se já há algo respondendo em `/api/health` antes de iniciar; usa `bun run hefaistia` (ou `node server/hefaistia.mjs` se `bun` não estiver no `PATH`); roda em primeiro plano, sem `sudo`. |
| `stop-hefaistia.sh`   | Encontra processos por `server/hefaistia.mjs` (nunca `killall node`) e pede confirmação antes de enviar `SIGTERM`. Se não achar nada, orienta a usar Ctrl+C ou `systemctl --user stop`.           |
| `status-hefaistia.sh` | Consulta `GET /api/health` e imprime saída humana (Hefaístia/Ollama/Héstia/Kaline Fallback). Sem `jq` — usa o próprio `node`.                                                                     |
| `install-local.sh`    | `bun install` + cria o atalho `.desktop` em `~/.local/share/applications`, sem root. Não cria serviço global, não baixa modelo, não expõe LAN.                                                    |
| `build-deb.sh`        | Gera um `.deb` **experimental** com `server/`, `knowledge/`, `package.json`, README e os arquivos de `packaging/`. Falha com mensagem clara se `dpkg-deb` não existir.                            |

### Atalho de menu (`.desktop`)

`packaging/klio-hefaistia.desktop` abre o navegador em `http://localhost:5173` — o
console visual. O placeholder `__REPO_DIR__` é substituído pelo caminho real do seu
clone por `install-local.sh` (modo dev) ou `build-deb.sh` (aponta para
`/opt/klio-hefaistia`). O atalho **não** inicia o runtime nem o frontend —
eles precisam já estar rodando.

### Serviço `systemd --user` (opcional)

`packaging/klio-hefaistia.service` é uma referência para rodar o runtime como
serviço do próprio usuário (nunca system-wide, nunca habilitado automaticamente):

```bash
mkdir -p ~/.config/systemd/user
cp packaging/klio-hefaistia.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user start klio-hefaistia   # inicia
systemctl --user enable klio-hefaistia  # opcional: inicia com a sessão
systemctl --user stop klio-hefaistia    # para
```

### `.deb` instalável local com runtime + console visual buildado + launcher de menu

```bash
bash scripts/build-deb.sh            # gera dist-deb/klio-hefaistia_0.1.0_all.deb
sudo dpkg -i dist-deb/klio-hefaistia_0.1.0_all.deb   # instalação manual, fora deste repo
```

## Instalar como app no Linux Mint Xfce

Gerar pacote:

```bash
bash scripts/build-deb.sh
```

Instalar:

```bash
sudo apt install ./dist-deb/klio-hefaistia_0.1.0_all.deb
```

Abrir:

```txt
Menu → Klio Hefaístia
```

Ou:

```bash
klio-hefaistia
```

Status:

```bash
klio-hefaistia-status
```

Parar runtime iniciado pelo launcher:

```bash
klio-hefaistia-stop
```

Logs locais:

```txt
~/.local/state/klio-hefaistia/runtime.log
```

Remover:

```bash
sudo apt remove klio-hefaistia
```

## Validação da instalação

Para validar a instalação real do `.deb` no Linux Mint Xfce, siga:

* [Installation Smoke Test](./docs/INSTALL_SMOKE_TEST.md)
* [Release Notes 0.1.0](./docs/RELEASE_0.1.0.md)

## Dados locais

A Hefaístia não grava dados do usuário em `/opt`.

- Configuração: `~/.config/klio-hefaistia/config.json`
- Sessões: `~/.local/share/klio-hefaistia/sessions`
- Logs/estado: `~/.local/state/klio-hefaistia`

## Token local

No modo instalado, a Hefaístia usa um token local gerado na primeira execução.
Esse token não é empacotado no `.deb`, não é logado e não é enviado à Totalidade.

## Tailscale privado

O acesso por outro aparelho deve ser feito apenas via tailnet e somente por ação explícita.
A Hefaístia não abre LAN por padrão e nunca usa `0.0.0.0` por padrão.

### Ícones

`public/icon-192.png`, `public/icon-512.png` e `public/apple-touch-icon.png` reúsam
o asset `klio-apple.png` já existente em `public/brand-assets/` (180×180). **Limitação
honesta:** este ambiente não tinha nenhuma ferramenta de imagem disponível (sem
ImageMagick, sem `sharp`, sem Pillow) para gerar versões redimensionadas de verdade
— os três arquivos são cópias do mesmo PNG de 180×180. Funciona (inclusive para
instalação como PWA, testado), mas fica borrado se ampliado. Trocar por artes reais
nos tamanhos declarados é uma melhoria futura de baixo risco.

### PWA instalável

A home (`/`) já atende aos critérios de instalação de PWA: `manifest.webmanifest`
aponta para `Klio Hefaístia` (nome, ícones, `theme_color`/`background_color`
`#08080E`, `display: standalone`, `start_url`/`scope` `/`), o service worker
(`public/sw.js`, já existente no projeto) registra e ativa, e as tags
`<link rel="manifest">`/`<link rel="icon">`/`<link rel="apple-touch-icon">` e os
metadados `apple-mobile-web-app-*` em `src/routes/__root.tsx` foram atualizados de
"K∧LINE" para "Klio Hefaístia". Testado com Playwright: manifest válido, ícones
resolvendo como PNG, service worker `active`.

### Puxar modelo do Ollama pela UI

A `ModelPanel` ganhou uma seção **Puxar modelo**: campo de texto + botão que chama
`POST /api/models/pull` (novo endpoint, proxy para `{OLLAMA_URL}/api/pull` com
`stream: false`). Isso é um download real (pode ser vários GB) — só acontece quando
o usuário clica no botão; nada é baixado automaticamente por nenhum outro fluxo.
Enquanto isso, o botão mostra "Baixando... pode demorar bastante" (sem barra de
progresso nesta versão — é uma chamada bloqueante). Se o Ollama estiver offline, a
`ModelPanel` também mostra um bloco "instalar o Ollama" com o comando oficial
(`curl -fsSL https://ollama.com/install.sh | sh`, copiável) e um link para
ollama.com/download — a Hefaístia nunca executa esse comando, só mostra.

Variável nova opcional para o runtime:

```txt
KLIO_PULL_TIMEOUT_MS=1800000   # 30min por padrão — download pode ser lento
```

### Painel de diagnóstico

A `StatusPanel` passou a mostrar, além de Hefaístia/Ollama/Héstia: se a **Kaline
Fallback** está configurada (via novo campo `kaline_fallback` em `GET /api/health`
— só indica `"configured"`/`"not_configured"`, nunca a chave), quantos arquivos de
**knowledge** foram carregados e qual o **modelo selecionado**. Se o runtime estiver
offline, mostra só o que a UI consegue saber (o resto fica como `—`).

### Testando o PR 5

```bash
bun install
bun run typecheck
bun run lint
bun run dev
bun run hefaistia
bash scripts/status-hefaistia.sh
```

- **Runtime offline:** abrir o frontend mostra o card "A Forja local ainda não está
  ligada" com comando e URL copiáveis e instruções expansíveis; nada quebra.
- **Runtime online, Ollama offline:** `status-hefaistia.sh` mostra a saída humana
  completa; a `ModelPanel` mostra o bloco de instalação do Ollama.
- **`install-local.sh`:** roda sem root, cria o `.desktop` em
  `~/.local/share/applications` com o caminho real do repo (nunca um caminho do
  ambiente do agente).
- **`build-deb.sh`:** sem `dpkg-deb`, falha com mensagem clara antes de tentar
  empacotar; com `dpkg-deb`, gera um `.deb` inspecionável com `dpkg-deb --contents`.

## Poda final e ponte assistida com Totalidade (PR 6)

Este PR fecha a v1: limpa o que sobrou do clone e melhora a ponte com a Kaline
Totalidade — que continua **manual e assistida**, nunca automática.

```txt
A ponte com a Totalidade é assistida e manual.
A Hefaístia não grava no Supabase.
A Hefaístia não altera a memória canônica.
Ká revisa, copia e cola.
```

### O que foi removido

Auditoria confirmou (via busca de uso real em todo o repo, não só menções) que os
itens abaixo tinham **zero referências** fora da própria definição:

- **17 componentes `src/components/ui/*.tsx`** sem nenhum import externo:
  `accordion`, `alert-dialog`, `aspect-ratio`, `avatar`, `checkbox`, `context-menu`,
  `dialog` (o wrapper — o pacote `@radix-ui/react-dialog` continua, usado
  diretamente por `sheet.tsx`), `form`, `hover-card`, `menubar`, `navigation-menu`,
  `popover`, `progress`, `radio-group`, `scroll-area`, `slider`, `switch`,
  `toggle`, `toggle-group`.
- **Dependências:** `react-hook-form`, `@hookform/resolvers` (usadas só por
  `ui/form.tsx`, removido junto), `date-fns` (zero uso em todo o repo), e os 17
  pacotes `@radix-ui/react-*` correspondentes aos componentes acima.

Depois da remoção: `bun run typecheck`, `bun run lint`, `bun run build` e
`bun run test` (55 testes) continuam passando sem erro.

### O que continuou por segurança (componentes órfãos)

Embora as rotas herdadas da Kaline Totalidade tenham sido completamente removidas no PR #8 (o que significa que páginas como `/auth`, `/convite`, `/portal/*` etc. não existem mais), alguns componentes e arquivos auxiliares (como chat com IA, Kuan-Yin, Câmara do Eco, Código, Jurídico, etc.) ainda continuam fisicamente na pasta `src/` para evitar quebras por referências cruzadas ou remoções agressivas. Eles não são mais acessíveis por nenhuma rota e são candidatos ideais para limpeza profunda em PRs futuros. A pasta `public/` também mantém arquivos legados não utilizados que serão podados oportunamente.

### Diferença entre export diário e bloco Totalidade

- **Diário** (`POST /api/context/export-daily`, desde o PR 3) — registro genérico
  de sessão (resumo, decisões, problemas, próximos passos), pensado para arquivo
  pessoal.
- **Totalidade** (`POST /api/context/export-totalidade`, novo neste PR) — formato
  específico para colar na Kaline Totalidade: tipo sugerido (`identidade` ou
  `memoria_relacional`), o que aconteceu, decisões confirmadas por Ká,
  preferências observadas, estado técnico da Hefaístia e próximos passos.

Nos dois casos: **nada é escrito em disco nem enviado automaticamente** — a
resposta é só o Markdown, para o usuário copiar. A `DailyExportPanel` (console)
agora tem duas abas, **Diário** e **Totalidade**, cada uma com seu botão
("Gerar contexto diário" / "Gerar bloco para Totalidade") e seu botão de copiar.

### Como gerar o bloco para Totalidade

```bash
curl -X POST http://127.0.0.1:4518/api/context/export-totalidade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-local" \
  -d '{
    "type_suggestion": "memoria_relacional",
    "what_happened": "Hoje a Hefaístia foi usada para testar a ponte com a Totalidade.",
    "confirmed_decisions": ["Ponte continua manual"],
    "observed_preferences": ["Ká prefere revisar antes de colar"],
    "technical_state": ["Runtime online", "Ollama offline neste teste"],
    "next_steps": ["Testar Tailscale em um PR futuro"]
  }'
```

A resposta traz `filename` e `markdown` — copie e cole manualmente onde quiser
sedimentar na Kaline Totalidade. Por que não há sync automático: a Totalidade já
tem seu próprio sistema de memória/contexto externo, e a Hefaístia nunca escreve
nele diretamente — só Ká decide o que entra, revisando antes de colar.

### Sessões de trabalho

Botão **Nova sessão** (painel "Sessão de trabalho" no console) chama
`POST /api/sessions` com um título opcional e cria `sessions/<data>-<slug>/` com
um `metadata.json` (`title`, `created_at`, `folder`). Escreve só dentro de
`sessions/` (nunca aceita path do cliente — o nome é sempre `data + título
sanitizado`), nunca sobrescreve uma pasta existente (acrescenta um sufixo
numérico em colisão) e nunca lê/apaga nada. `sessions/` está no `.gitignore`.

### Testando o PR 6

```bash
bun install
bun run typecheck
bun run lint
bun run test
bun run dev
bun run hefaistia
```

- Console abre normalmente; Klio Local, Kaline Fallback (quando configurada) e
  Auto continuam respondendo como antes.
- Export diário continua funcionando sem mudança de comportamento.
- Aba Totalidade gera o bloco, mostra `filename` + Markdown, e "Copiar bloco para
  Totalidade" funciona.
- Botão "Nova sessão" cria a pasta e mostra o caminho criado.
- Nenhuma rota antiga (`/api/health`, `/api/models`, `/api/benchmark`,
  `/api/tasks`, `/api/knowledge`, `/api/klio/chat`, `/api/kaline/fallback`,
  `/api/route-task`, `/api/models/pull`, `/api/context/export-daily`) quebrou.
- `package.json` não perdeu nenhuma dependência que ainda esteja em uso — só as
  20 confirmadas mortas por busca de uso real.

## Diagnóstico local

A Hefaístia possui uma seção “Estado da Forja” para listar o funcionamento dos sistemas locais.

Ela mostra estados honestos de runtime, API, token local, diretórios XDG, sessões, knowledge, Ollama, modelos, fallback, exportação manual, Tailnet e segurança de rede.

A tela não executa comandos do sistema, não lê segredos, não mostra tokens e não configura Tailscale automaticamente.
## Túnel de Kairós

A Hefaístia pode importar manualmente um envelope cifrado gerado pela Totalidade em `/api/bridge/olhar-de-kairos`.

O túnel:
- não é sync automático;
- não armazena token Supabase;
- não escreve na Totalidade;
- não abre LAN;
- não inclui Kuan-Yin;
- usa chave compartilhada local;
- salva apenas o último snapshot em diretório XDG.

Ver também:

- [Guia futuro para a Totalidade](./docs/TOTALIDADE_KAIROS_TUNNEL_GUIDE.md)

## Desenvolvimento

Este repositório segue o modo Ponytail para futuras alterações por IA codificadora.

Antes de implementar qualquer feature, leia:

- [AGENTS.md](./AGENTS.md)
