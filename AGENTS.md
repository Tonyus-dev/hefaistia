# AGENTS.md — Modo Ponytail

Este repositório deve ser trabalhado em modo Ponytail.

## Lema

> O melhor código é o código que nunca foi escrito.

## Regras antes de escrever código

Antes de escrever qualquer linha de código, pergunte:

1. Isso precisa mesmo ser construído? Se não agregar valor real, pule.
2. Já existe algo parecido no projeto? Reutilize o código atual, não reescreva.
3. A biblioteca padrão da linguagem já resolve isso? Use-a.
4. O navegador, o Linux ou o sistema já resolve isso nativamente? Use o nativo.
5. Alguma dependência já instalada resolve isso? Verifique package.json antes.
6. Dá para fazer em uma linha de forma legível? Faça em uma linha.
7. Dá para resolver com documentação em vez de código? Prefira documentação.
8. Dá para resolver sem backend novo, banco novo, login novo, fila, job, worker ou serviço? Prefira sem.
9. Dá para resolver sem nova dependência? Prefira sem.
10. Escreva apenas o código mínimo que funciona.

## Diretrizes da Hefaístia

A Hefaístia é um app local, privado e enxuto.

Ela deve continuar sendo:

- local-first;
- loopback-first;
- sem exposição de rede por padrão;
- sem login próprio;
- sem Supabase obrigatório;
- sem telemetria;
- sem dashboard ornamental;
- sem métricas falsas;
- sem automação perigosa;
- sem shell pela UI;
- sem upload/file manager desnecessário.

## Regras de implementação

Ao implementar qualquer mudança:

- faça o menor patch possível;
- não refatore por estética;
- não renomeie sem necessidade;
- não adicione dependência sem prova de necessidade;
- não duplique código existente;
- não altere empacotamento se o PR não for de empacotamento;
- não altere segurança se o PR não for de segurança;
- não abra LAN por padrão;
- não use 0.0.0.0 por conveniência;
- preserve KLIO_HOST=127.0.0.1 como padrão;
- preserve KLIO_PORT=4518 como padrão.

## Checklist antes de finalizar

Antes de concluir um PR, responda objetivamente:

- O que foi evitado construir?
- O que foi reutilizado?
- Alguma dependência nova foi adicionada? Por quê?
- Alguma superfície de rede foi aberta? Por quê?
- Alguma feature poderia ser documentação em vez de código?
- O patch é menor do que poderia ser?

## Testes

Quando houver mudança de código, rode:

npm run typecheck
npm run lint
npm run test
npm run build

Quando houver mudança de empacotamento, rode também:

bash scripts/build-deb.sh

Quando for mudança só documental, no mínimo rode:

git diff --check
