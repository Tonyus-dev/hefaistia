import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  friendlyErrorMessage,
  isHefaistiaError,
  type HefaistiaClient,
  type HefaistiaClientError,
} from "@/lib/hefaistia/client";
import type { OllamaModelsResponse } from "@/lib/hefaistia/types";

interface ModelPanelProps {
  client: HefaistiaClient;
  modelsData: OllamaModelsResponse | HefaistiaClientError | null;
  loadedData: OllamaModelsResponse | HefaistiaClientError | null;
  loading: boolean;
  onRefresh: () => void;
  selectedModel: string;
  onSelectModel: (name: string) => void;
}

const OLLAMA_INSTALL_COMMAND = "curl -fsSL https://ollama.com/install.sh | sh";

async function copyText(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Não foi possível copiar automaticamente. Selecione o texto manualmente.");
  }
}

export function ModelPanel({
  client,
  modelsData,
  loadedData,
  loading,
  onRefresh,
  selectedModel,
  onSelectModel,
}: ModelPanelProps) {
  const [pullModelName, setPullModelName] = useState("");
  const [pulling, setPulling] = useState(false);
  const [pullError, setPullError] = useState<HefaistiaClientError | null>(null);
  const [pullResult, setPullResult] = useState<string | null>(null);

  const installedNames = !isHefaistiaError(modelsData)
    ? (modelsData?.models ?? []).map((model) => model.name ?? model.model ?? "").filter(Boolean)
    : [];
  const loadedNames = !isHefaistiaError(loadedData)
    ? (loadedData?.models ?? []).map((model) => model.name ?? model.model ?? "").filter(Boolean)
    : [];

  const ollamaOffline =
    (isHefaistiaError(modelsData) && modelsData.code === "OLLAMA_OFFLINE") ||
    (isHefaistiaError(loadedData) && loadedData.code === "OLLAMA_OFFLINE");

  async function handlePull() {
    const model = pullModelName.trim();
    if (!model) return;

    setPulling(true);
    setPullError(null);
    setPullResult(null);

    const response = await client.pullModel(model);

    if (isHefaistiaError(response)) {
      setPullError(response);
      setPulling(false);
      return;
    }

    setPullResult(`Modelo "${response.model}" puxado com sucesso (${response.status}).`);
    setPulling(false);
    onRefresh();
  }

  return (
    <Card className="border-border bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Modelos</CardTitle>
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {ollamaOffline ? (
          <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
            <p className="text-foreground">
              Ollama não foi encontrado. Ele é um programa separado — a Hefaístia não o instala por
              conta própria.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded bg-background/60 px-2 py-1 text-xs">
                {OLLAMA_INSTALL_COMMAND}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyText(OLLAMA_INSTALL_COMMAND, "Comando copiado.")}
              >
                Copiar comando
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ou baixe manualmente em{" "}
              <a
                href="https://ollama.com/download"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                ollama.com/download
              </a>
              . Depois de instalado, rode <code className="text-foreground">ollama serve</code> e
              clique em Atualizar aqui.
            </p>
          </div>
        ) : null}

        <div>
          <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            Instalados no Ollama
          </p>
          {isHefaistiaError(modelsData) ? (
            <p className="whitespace-pre-line text-foreground">
              {friendlyErrorMessage(modelsData)}
            </p>
          ) : installedNames.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhum modelo encontrado no Ollama. Você precisa puxar um modelo no Ollama antes.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {installedNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSelectModel(name)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs transition-colors",
                    name === selectedModel
                      ? "border-kaline bg-kaline/15 text-foreground"
                      : "border-border bg-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            Carregados agora
          </p>
          {isHefaistiaError(loadedData) ? (
            <p className="whitespace-pre-line text-foreground">
              {friendlyErrorMessage(loadedData)}
            </p>
          ) : loadedNames.length === 0 ? (
            <p className="text-muted-foreground">Nenhum modelo carregado no momento.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {loadedNames.map((name) => (
                <Badge key={name} variant="secondary">
                  {name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {selectedModel ? (
          <p className="text-xs text-muted-foreground">Selecionado: {selectedModel}</p>
        ) : null}

        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Puxar modelo</p>
          <p className="text-xs text-muted-foreground">
            Baixa o modelo do registry do Ollama. Isso é um download real (pode ser vários GB) —
            certifique-se de ter espaço em disco e conexão estável. Só acontece quando você clica no
            botão abaixo; a Hefaístia nunca baixa nada sozinha.
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              value={pullModelName}
              onChange={(event) => setPullModelName(event.target.value)}
              placeholder="qwen2.5:0.5b"
              className="max-w-xs"
            />
            <Button size="sm" onClick={handlePull} disabled={pulling || !pullModelName.trim()}>
              {pulling ? "Baixando... pode demorar bastante" : "Puxar modelo"}
            </Button>
          </div>
          {pullError ? (
            <p className="whitespace-pre-line text-xs text-destructive">
              {friendlyErrorMessage(pullError)}
            </p>
          ) : null}
          {pullResult ? <p className="text-xs text-drive">{pullResult}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
