import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  isHefaistiaError,
  type HefaistiaClient,
  type HefaistiaClientError,
} from "@/lib/hefaistia/client";
import type {
  HefaistiaHealth,
  KnowledgeList,
  OllamaModelsResponse,
  SystemPaths,
  SessionsStatus,
} from "@/lib/hefaistia/types";

interface SystemMapPanelProps {
  client: HefaistiaClient;
  apiUrl: string;
  token: string;
  selectedModel: string;
}

type StatusType =
  "OK" | "Offline" | "Não configurado" | "Atenção" | "Desconhecido" | "Manual" | "Configurado";

interface SystemStatusItem {
  name: string;
  status: StatusType;
  description: string;
  action?: string;
}

export function SystemMapPanel({ client, apiUrl, token, selectedModel }: SystemMapPanelProps) {
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<HefaistiaHealth | HefaistiaClientError | null>(null);
  const [paths, setPaths] = useState<SystemPaths | HefaistiaClientError | null>(null);
  const [sessions, setSessions] = useState<SessionsStatus | HefaistiaClientError | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeList | HefaistiaClientError | null>(null);
  const [models, setModels] = useState<OllamaModelsResponse | HefaistiaClientError | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      client.getHealth(),
      client.getSystemPaths(),
      client.getSessionsStatus(),
      client.getKnowledge(),
      client.getModels(),
    ]);

    if (results[0].status === "fulfilled") setHealth(results[0].value);
    else setHealth({ ok: false, code: "ERROR", error: "Erro de rede ao consultar health" });

    if (results[1].status === "fulfilled") setPaths(results[1].value);
    else setPaths({ ok: false, code: "ERROR", error: "Erro de rede ao consultar caminhos" });

    if (results[2].status === "fulfilled") setSessions(results[2].value);
    else setSessions({ ok: false, code: "ERROR", error: "Erro de rede ao consultar sessões" });

    if (results[3].status === "fulfilled") setKnowledge(results[3].value);
    else setKnowledge({ ok: false, code: "ERROR", error: "Erro de rede ao consultar knowledge" });

    if (results[4].status === "fulfilled") setModels(results[4].value);
    else setModels({ ok: false, code: "ERROR", error: "Erro de rede ao consultar modelos" });

    setLoading(false);
  }, [client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Compute status items
  const items: SystemStatusItem[] = [];

  // 1. Runtime local
  const runtimeOffline = isHefaistiaError(health) && health.code === "RUNTIME_OFFLINE";
  const healthOk = health && !isHefaistiaError(health);
  items.push({
    name: "Runtime local",
    status: runtimeOffline ? "Offline" : healthOk ? "OK" : "Desconhecido",
    description: healthOk
      ? `Hefaístia v${health.version} rodando em ${health.host}:${health.port}.`
      : "O servidor local da Hefaístia não está respondendo.",
    action: runtimeOffline ? "Inicie o runtime com 'bun run hefaistia' no terminal." : undefined,
  });

  // 2. API local
  let isLocalhost = false;
  try {
    const hostname = new URL(apiUrl).hostname;
    isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    // Ignore invalid URL errors
  }
  items.push({
    name: "API local",
    status: isLocalhost ? "OK" : "Atenção",
    description: `API configurada no endereço ${apiUrl} (token oculto).`,
    action: !isLocalhost
      ? "Dê preferência a endereços de loopback para maior privacidade."
      : undefined,
  });

  // 3. Token local
  const hasToken = Boolean(token);
  const isDevToken = token === "dev-local";
  items.push({
    name: "Token local",
    status: !hasToken ? "Não configurado" : isDevToken ? "Atenção" : "OK",
    description: isDevToken
      ? "Usando o token de desenvolvimento padrão ('dev-local')."
      : hasToken
        ? "Token local carregado com sucesso no navegador."
        : "Nenhum token configurado no navegador.",
    action: isDevToken
      ? "Defina um KLIO_TOKEN customizado no ambiente do runtime para produção."
      : undefined,
  });

  // 4. XDG dirs
  const pathsOk = paths && !isHefaistiaError(paths);
  items.push({
    name: "Diretórios XDG",
    status: pathsOk ? "OK" : "Desconhecido",
    description: pathsOk
      ? `Config: ${paths.configDir} | Data: ${paths.dataDir} | State: ${paths.stateDir}`
      : "Não foi possível obter os caminhos locais do sistema.",
    action: "Verifique as permissões de leitura/escrita do usuário nestes caminhos.",
  });

  // 5. Sessões locais
  const sessionsOk = sessions && !isHefaistiaError(sessions);
  items.push({
    name: "Sessões locais",
    status: sessionsOk ? "OK" : "Desconhecido",
    description: sessionsOk
      ? `${sessions.count} pasta(s) de sessão ativa(s) em ${sessions.sessionsDir}.`
      : "Não foi possível verificar a contagem de sessões.",
    action: "Crie novas sessões utilizando o painel de Sessão de Trabalho.",
  });

  // 6. Knowledge local
  const knowledgeOk = knowledge && !isHefaistiaError(knowledge);
  const knowledgeEmpty = knowledgeOk && knowledge.items.length === 0;
  items.push({
    name: "Knowledge local",
    status: knowledgeEmpty ? "Atenção" : knowledgeOk ? "OK" : "Desconhecido",
    description: knowledgeOk
      ? `${knowledge.total_chars} caracteres carregados em ${knowledge.items.length} arquivo(s) de knowledge.`
      : "Não foi possível listar os marcos do knowledge.",
    action: knowledgeEmpty
      ? "Adicione arquivos Markdown (.md) na pasta knowledge/ do repositório."
      : undefined,
  });

  // 7. Ollama
  const ollamaOnline = healthOk && health.ollama === "online";
  const ollamaOffline = healthOk && health.ollama === "offline";
  items.push({
    name: "Ollama",
    status: ollamaOnline ? "OK" : ollamaOffline ? "Offline" : "Desconhecido",
    description: ollamaOnline
      ? "API local do Ollama respondendo normalmente em 127.0.0.1:11434."
      : "Ollama offline ou indisponível em 127.0.0.1:11434.",
    action: ollamaOffline ? "Inicie o Ollama localmente (ex.: ollama serve)." : undefined,
  });

  // 8. Modelos
  const modelsOk = models && !isHefaistiaError(models);
  const defaultInstalled =
    modelsOk &&
    models.models.some(
      (m) => m.name?.startsWith(selectedModel) || m.model?.startsWith(selectedModel),
    );
  items.push({
    name: "Modelos",
    status: ollamaOffline ? "Offline" : defaultInstalled ? "OK" : "Atenção",
    description: modelsOk
      ? `Modelo selecionado: '${selectedModel || "Nenhum"}' | Total instalados: ${models.models.length}`
      : "Não foi possível obter a lista de modelos do Ollama.",
    action:
      !defaultInstalled && !ollamaOffline
        ? "Baixe o modelo selecionado ou escolha um modelo disponível."
        : undefined,
  });

  // 9. Fallback Kaline/OpenRouter
  const fallbackConfigured = healthOk && health.kaline_fallback === "configured";
  items.push({
    name: "Fallback Kaline/OpenRouter",
    status: runtimeOffline ? "Offline" : fallbackConfigured ? "Configurado" : "Não configurado",
    description: fallbackConfigured
      ? "Chave OpenRouter configurada. Fallback inteligente ativo."
      : "Chave OpenRouter não configurada. Fallback ficará indisponível.",
    action:
      !fallbackConfigured && !runtimeOffline
        ? "Defina OPENROUTER_API_KEY no runtime se desejar usar fallback remoto."
        : undefined,
  });

  // 10. Exportação Totalidade
  items.push({
    name: "Exportação Totalidade",
    status: "OK",
    description: "Exportação manual de contexto e sessões para a Totalidade disponível.",
    action: "Use os painéis de exportação para gerar os arquivos Markdown copiáveis.",
  });

  // 11. Tailnet/Tailscale
  items.push({
    name: "Tailnet/Tailscale",
    status: "Manual",
    description: "Acesso por rede privada Tailscale configurável externamente.",
    action: "Rode 'tailscale status' e use 'klio-hefaistia-tailnet' para expor de forma segura.",
  });

  // 12. Segurança de rede
  const isLoopbackOnly =
    isLocalhost && (!healthOk || health.host === "127.0.0.1" || health.host === "localhost");
  items.push({
    name: "Segurança de rede",
    status: isLoopbackOnly ? "OK" : "Atenção",
    description: isLoopbackOnly
      ? "Modo loopback-first ativo. Servidor blindado contra acessos externos."
      : `Servidor configurado no host '${healthOk ? health.host : apiUrl}'. Acesso LAN pode estar liberado.`,
    action: !isLoopbackOnly
      ? "Mantenha o host configurado como 127.0.0.1 para segurança máxima."
      : undefined,
  });

  // 13. Logs
  const stateDir = pathsOk ? paths.stateDir : "~/.local/state/klio-hefaistia";
  items.push({
    name: "Logs locais",
    status: "Manual",
    description: `Arquivo de logs do runtime: ${stateDir}/runtime.log`,
    action: "Abra este arquivo no terminal para depurar erros detalhados.",
  });

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case "OK":
      case "Configurado":
        return "text-green-500 border-green-500/20 bg-green-500/10";
      case "Offline":
        return "text-destructive border-destructive/20 bg-destructive/10";
      case "Atenção":
        return "text-yellow-500 border-yellow-500/20 bg-yellow-500/10";
      case "Não configurado":
        return "text-muted-foreground border-muted-foreground/20 bg-muted-foreground/10";
      case "Manual":
        return "text-blue-500 border-blue-500/20 bg-blue-500/10";
      default:
        return "text-muted-foreground border-muted-foreground/20 bg-muted-foreground/10";
    }
  };

  return (
    <Card className="border-border bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Estado da Forja</CardTitle>
        <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
          {loading ? "Verificando..." : "Atualizar diagnóstico"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Diagnóstico do ecossistema local. Sem telemetria, medições falsas ou dashboards
          ornamentais.
        </p>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.name}
              className="flex flex-col space-y-1 rounded-md border border-border/40 p-2.5 bg-background/30"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{item.name}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none ${getStatusColor(item.status)}`}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/90">{item.description}</p>
              {item.action && (
                <p className="text-[11px] text-muted-foreground/70 italic mt-0.5">
                  💡 Ação: {item.action}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
