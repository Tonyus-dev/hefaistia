import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  friendlyErrorMessage,
  isHefaistiaError,
  type HefaistiaClientError,
} from "@/lib/hefaistia/client";
import type { KnowledgeList } from "@/lib/hefaistia/types";

interface KnowledgePanelProps {
  data: KnowledgeList | HefaistiaClientError | null;
  loading: boolean;
  onRefresh: () => void;
}

export function KnowledgePanel({ data, loading, onRefresh }: KnowledgePanelProps) {
  return (
    <Card className="border-border bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Knowledge</CardTitle>
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {loading && !data ? (
          <p className="text-muted-foreground">Consultando...</p>
        ) : isHefaistiaError(data) ? (
          <p className="whitespace-pre-line text-foreground">{friendlyErrorMessage(data)}</p>
        ) : data && data.items.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhum marco carregado. A Klio Local ainda funciona, mas fica menos dirigida.
          </p>
        ) : data ? (
          <div className="space-y-2">
            <ul className="space-y-1">
              {data.items.map((item) => (
                <li key={item.file} className="flex items-center justify-between">
                  <span className="text-foreground">{item.file}</span>
                  <span className="text-xs text-muted-foreground">{item.chars} chars</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">total: {data.total_chars} caracteres</p>
            {data.warnings.length > 0 ? (
              <ul className="list-inside list-disc text-xs text-muted-foreground">
                {data.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
