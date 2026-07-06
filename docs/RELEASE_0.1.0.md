# Klio Hefaístia 0.1.0 — Release Notes

## Resumo

A versão `0.1.0` consolida a Klio Hefaístia como app local instalável para Linux Mint Xfce.

A Hefaístia é a forja local da Kaline: executa tarefas técnicas, conversa com Ollama local, mede resultados reais e exporta contexto para sedimentação manual na Totalidade.

## O que esta versão entrega

- App instalável via `.deb`.
- Launcher local `klio-hefaistia`.
- Comando de status `klio-hefaistia-status`.
- Comando de parada segura `klio-hefaistia-stop`.
- Runtime local em `127.0.0.1:4518`.
- Console visual local.
- Empacotamento com frontend compilado.
- Dados locais em diretórios XDG.
- Token local forte gerado em runtime.
- Modo Tailnet opt-in.
- Superfície de rotas enxuta.
- Remoção de rotas herdadas da Totalidade.
- Contexto Ponytail documentado em `AGENTS.md`.

## O que esta versão não faz

- Não abre LAN por padrão.
- Não usa `0.0.0.0` por conveniência.
- Não baixa modelos automaticamente.
- Não instala Ollama.
- Não executa shell pela UI.
- Não cria file manager.
- Não faz upload de arquivos.
- Não sincroniza automaticamente com a Totalidade.
- Não usa Cloudflare.
- Não exige Supabase para a interface local.
- Não inicia serviço automaticamente após instalação.

## Segurança

- O modo padrão é loopback-first.
- O token local é gerado na máquina do usuário.
- O token não é empacotado no `.deb`.
- O token não deve aparecer em `/api/health`.
- Logs e estado ficam fora de `/opt`.
- Tailnet é opt-in e deve bindar apenas no IP Tailscale.

## Limitações conhecidas

- A janela usa navegador em modo app, não Electron/Tauri.
- O ícone pode aparecer como ícone do navegador em alguns painéis do Xfce.
- Ollama precisa estar instalado separadamente.
- Modelos precisam ser baixados manualmente.
- Tailnet precisa ser configurado manualmente no Tailscale antes do uso.

## Smoke test

Antes de considerar a versão validada em máquina real, siga:

- `docs/INSTALL_SMOKE_TEST.md`
