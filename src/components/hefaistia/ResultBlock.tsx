import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LazyMarkdown } from "@/components/LazyMarkdown";
import { friendlyErrorMessage, type HefaistiaClientError } from "@/lib/hefaistia/client";
import type { HefaistiaMetrics } from "@/lib/hefaistia/types";

export interface ResultBlockData {
  provider?: string;
  model?: string;
  route?: string;
  reason?: string;
  result?: string;
  metrics?: HefaistiaMetrics | null;
  warnings?: string[];
}

interface ResultBlockProps {
  loading?: boolean;
  loadingLabel?: string;
  error?: HefaistiaClientError | null;
  data?: ResultBlockData | null;
  emptyHint?: string;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência.");
  } catch {
    toast.error("Não foi possível copiar automaticamente. Selecione o texto manualmente.");
  }
}

export function ResultBlock({ loading, loadingLabel, error, data, emptyHint }: ResultBlockProps) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">{loadingLabel ?? "Consultando..."}</p>;
  }

  if (error) {
    return (
      <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
        <p className="whitespace-pre-line text-sm text-foreground">{friendlyErrorMessage(error)}</p>
        {error.suggestion ? (
          <p className="text-xs text-muted-foreground">Sugestão: {error.suggestion}</p>
        ) : null}
        <p className="text-xs text-muted-foreground/70">código: {error.code}</p>
      </div>
    );
  }

  if (!data) {
    return emptyHint ? <p className="text-sm text-muted-foreground">{emptyHint}</p> : null;
  }

  const tokensPerSecond = data.metrics?.tokens_per_second;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {data.provider ? <Badge variant="outline">{data.provider}</Badge> : null}
        {data.model ? <Badge variant="secondary">{data.model}</Badge> : null}
        {data.route ? <Badge className="bg-klio text-ivory">{data.route}</Badge> : null}
      </div>

      {data.reason ? <p className="text-xs text-muted-foreground">Motivo: {data.reason}</p> : null}

      {data.result ? (
        <div className="rounded-md border border-border bg-background/40 p-3 text-sm leading-relaxed [&_p]:mb-2 [&_pre]:overflow-x-auto">
          <LazyMarkdown>{data.result}</LazyMarkdown>
        </div>
      ) : null}

      {data.metrics ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            tokens/s:{" "}
            {tokensPerSecond === null || tokensPerSecond === undefined
              ? "Ollama não retornou métrica suficiente"
              : tokensPerSecond.toFixed(2)}
          </span>
          {data.metrics.eval_count !== null ? (
            <span>eval_count: {data.metrics.eval_count}</span>
          ) : null}
          {data.metrics.total_duration !== null ? (
            <span>duração: {(data.metrics.total_duration / 1e9).toFixed(2)}s</span>
          ) : null}
        </div>
      ) : null}

      {data.warnings && data.warnings.length > 0 ? (
        <ul className="list-inside list-disc text-xs text-muted-foreground">
          {data.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {data.result ? (
        <Button size="sm" variant="outline" onClick={() => copyText(data.result ?? "")}>
          Copiar resultado
        </Button>
      ) : null}
    </div>
  );
}
