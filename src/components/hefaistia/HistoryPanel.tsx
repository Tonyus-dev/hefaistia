import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HefaistiaHistoryItem } from "@/lib/hefaistia/local-history";

interface HistoryPanelProps {
  history: HefaistiaHistoryItem[];
  onClear: () => void;
}

async function copyResult(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência.");
  } catch {
    toast.error("Não foi possível copiar automaticamente. Selecione o texto manualmente.");
  }
}

export function HistoryPanel({ history, onClear }: HistoryPanelProps) {
  return (
    <Card className="border-border bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Histórico local</CardTitle>
        {history.length > 0 ? (
          <Button size="sm" variant="ghost" onClick={onClear}>
            Limpar histórico
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {history.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma interação registrada ainda.</p>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="space-y-1 rounded-md border border-border bg-background/40 p-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.mode}</Badge>
                  <span className="text-foreground">{item.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleTimeString()}
                </span>
              </div>
              {item.result ? (
                <p className="line-clamp-3 text-xs text-muted-foreground">{item.result}</p>
              ) : null}
              {item.result ? (
                <Button size="sm" variant="outline" onClick={() => copyResult(item.result ?? "")}>
                  Copiar
                </Button>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
