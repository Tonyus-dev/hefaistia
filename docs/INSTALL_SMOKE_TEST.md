# Installation Smoke Test — Klio Hefaístia

Este documento descreve o teste manual de instalação local da Klio Hefaístia no Linux Mint Xfce.

## Objetivo

Validar que o pacote `.deb` instala, abre, responde localmente, salva estado nos diretórios corretos e pode ser parado com segurança.

Este teste não valida qualidade de modelo, benchmark de IA, Tailnet real ou integração com a Totalidade.

## Pré-requisitos

- Linux Mint Xfce ou ambiente Debian/Ubuntu equivalente.
- Node.js instalado pela dependência do pacote.
- Navegador instalado.
- Pacote `.deb` gerado localmente em `dist-deb/`.
- Ollama é opcional para este smoke test.

## 1. Conferir artefato local

```bash
ls -lh dist-deb/*.deb
dpkg-deb --info dist-deb/*.deb
dpkg-deb --contents dist-deb/*.deb | grep -E '/opt/klio-hefaistia|/usr/bin/klio-hefaistia|/usr/share/applications'
```

Esperado:

* pacote `klio-hefaistia`;
* versão correta;
* arquivos em `/opt/klio-hefaistia`;
* comandos em `/usr/bin`;
* launcher `.desktop`.

## 2. Instalar o pacote

```bash
sudo apt install ./dist-deb/klio-hefaistia_0.1.0_all.deb
```

Esperado:

* instalação sem erro;
* nenhum processo iniciado automaticamente;
* nenhum modelo baixado;
* nenhuma porta aberta automaticamente.

## 3. Abrir localmente

```bash
klio-hefaistia
```

Esperado:

* runtime inicia em `127.0.0.1:4518`;
* navegador abre a interface;
* a URL não exibe token depois do carregamento;
* UI abre sem login;
* se Ollama estiver offline, a UI mostra estado honesto.

## 4. Validar health local

```bash
curl -s http://127.0.0.1:4518/api/health
```

Esperado:

* resposta JSON válida;
* sem token na resposta;
* sem segredo exposto;
* host local.

## 5. Validar status

```bash
klio-hefaistia-status
```

Esperado:

* mostra se o runtime está ativo;
* não exige `jq`;
* não imprime token.

## 6. Validar diretórios XDG

```bash
ls -la ~/.config/klio-hefaistia
ls -la ~/.local/state/klio-hefaistia
ls -la ~/.local/share/klio-hefaistia
```

Esperado:

* `~/.config/klio-hefaistia/config.json` existe;
* `config.json` tem permissão restrita;
* logs ficam em `~/.local/state/klio-hefaistia`;
* sessões ficam em `~/.local/share/klio-hefaistia`;
* nenhum dado de usuário é gravado em `/opt/klio-hefaistia`.

## 7. Validar stop

```bash
klio-hefaistia-stop
klio-hefaistia-status
```

Esperado:

* runtime local encerrado;
* nenhum `node` genérico é morto;
* nenhum `killall` é usado.

## 8. Validar logs

```bash
cat ~/.local/state/klio-hefaistia/runtime.log
```

Esperado:

* sem token;
* sem chave OpenRouter;
* sem segredo;
* erros legíveis se houver.

## 9. Tailnet

O modo Tailnet é opt-in e deve ser testado separadamente.

Não faz parte deste smoke test básico.

Para teste futuro:

```bash
tailscale status
tailscale ip -4
klio-hefaistia-tailnet
```

O comando não deve imprimir token por padrão.

Para primeiro acesso remoto na Tailnet:

```bash
klio-hefaistia-tailnet --show-token
```

A URL com token deve ser tratada como segredo local.

## 10. Remoção

```bash
sudo apt remove klio-hefaistia
```

Esperado:

* pacote removido;
* cache de ícones/desktop atualizado;
* dados do usuário em `~/.config`, `~/.local/share` e `~/.local/state` não são apagados automaticamente.

## Resultado esperado final

O smoke test passa se:

* app instala;
* app abre;
* health responde;
* token não vaza;
* dados ficam em XDG dirs;
* `/opt` contém apenas app instalado;
* stop funciona;
* Tailnet permanece opt-in;
* nenhuma LAN é aberta por padrão.
