import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isHefaistiaError, type HefaistiaClientError } from "@/lib/hefaistia/client";
import type { HefaistiaHealth } from "@/lib/hefaistia/types";

interface StatusPanelProps {
  apiUrl: string;
  health: HefaistiaHealth | HefaistiaClientError | null;
  loading: boolean;
  onRefresh: () => void;
  knowledgeCount: number | null;
  selectedModel: string;
}

function StatusDot({ state }: { state: "online" | "offline" | "unknown" }) {
  const color =
    state === "online"
      ? "bg-drive"
      : state === "offline"
        ? "bg-destructive"
        : "bg-muted-foreground/50";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden="true" />;
}

async function copyCommand() {
  try {
    await navigator.clipboard.writeText("bun run hefaistia");
    toast.success("Comando copiado.");
  } catch {
    toast.error("Não foi possível copiar. Digite manualmente: bun run hefaistia");
  }
}

export function StatusPanel({
  apiUrl,
  health,
  loading,
  onRefresh,
  knowledgeCount,
  selectedModel,
}: StatusPanelProps) {
  const offline = isHefaistiaError(health) && health.code === "RUNTIME_OFFLINE";

  return (
    <Card className="border-border bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Status</CardTitle>
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {offline ? (
          <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
            <p className="text-foreground">Runtime da Hefaístia não está rodando em {apiUrl}.</p>
            <div className="flex items-center gap-2">
              <code className="rounded bg-background/60 px-2 py-1 text-xs">bun run hefaistia</code>
              <Button size="sm" variant="outline" onClick={copyCommand}>
                Copiar comando
              </Button>
            </div>
          </div>
        ) : isHefaistiaError(health) ? (
          <p className="text-foreground">{health.error}</p>
        ) : health ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Hefaístia</span>
              <span className="flex items-center gap-2">
                <StatusDot state="online" />
                online · porta {health.port}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ollama</span>
              <span className="flex items-center gap-2">
                <StatusDot state={health.ollama} />
                {health.ollama}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Héstia (opcional)</span>
              <span className="flex items-center gap-2">
                <StatusDot state={health.hestia} />
                {health.hestia}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Kaline Fallback</span>
              <span className="flex items-center gap-2">
                <StatusDot state={health.kaline_fallback === "configured" ? "online" : "unknown"} />
                {health.kaline_fallback === "configured" ? "configurada" : "não configurada"}
              </span>
            </div>
            {health.hestia === "offline" ? (
              <p className="text-xs text-muted-foreground">
                Héstia está offline ou indisponível. Isso é opcional e não bloqueia a Hefaístia.
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground/70">
              consultado em {new Date(health.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground">Consultando...</p>
        )}

        <div className="space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Knowledge carregado</span>
            <span>{knowledgeCount === null ? "—" : `${knowledgeCount} arquivo(s)`}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Modelo selecionado</span>
            <span>{selectedModel || "—"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
