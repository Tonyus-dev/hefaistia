import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  isHefaistiaError,
  type HefaistiaClient,
  type HefaistiaClientError,
} from "@/lib/hefaistia/client";

interface SessionPanelProps {
  client: HefaistiaClient;
}

export function SessionPanel({ client }: SessionPanelProps) {
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<HefaistiaClientError | null>(null);
  const [lastSession, setLastSession] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    setError(null);

    const response = await client.createSession({ title: title.trim() || undefined });

    if (isHefaistiaError(response)) {
      setError(response);
      setCreating(false);
      return;
    }

    setLastSession(response.path);
    setTitle("");
    toast.success(`Sessão criada em ${response.path}`);
    setCreating(false);
  }

  return (
    <Card className="border-border bg-card/60">
      <CardHeader>
        <CardTitle className="text-base">Sessão de trabalho</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-xs text-muted-foreground">
          Cria uma pasta em <code className="text-foreground">sessions/</code> com um{" "}
          <code className="text-foreground">metadata.json</code> — só por este botão, nunca
          automaticamente.
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Título opcional da sessão"
            className="max-w-xs"
          />
          <Button size="sm" onClick={handleCreate} disabled={creating}>
            {creating ? "Criando..." : "Nova sessão"}
          </Button>
        </div>
        {error ? <p className="text-xs text-destructive">{error.error}</p> : null}
        {lastSession ? <p className="text-xs text-drive">Última sessão: {lastSession}</p> : null}
      </CardContent>
    </Card>
  );
}
