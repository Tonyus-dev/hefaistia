import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isHefaistiaError, type HefaistiaClient } from "@/lib/hefaistia/client";
import type { KairosStatus, KairosEnvelope } from "@/lib/hefaistia/types";

interface KairosTunnelPanelProps {
  client: HefaistiaClient;
}

export function KairosTunnelPanel({ client }: KairosTunnelPanelProps) {
  const [status, setStatus] = useState<KairosStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharedKey, setSharedKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [envelopeText, setEnvelopeText] = useState("");
  const [importing, setImporting] = useState(false);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    const result = await client.getKairosStatus();
    if (isHefaistiaError(result)) {
      toast.error(`Falha ao obter status: ${result.error}`);
    } else {
      setStatus(result);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  async function handleSaveKey() {
    if (!sharedKey.trim()) {
      toast.error("A chave compartilhada não pode ser vazia.");
      return;
    }
    setSavingKey(true);
    const result = await client.saveKairosConfig(sharedKey.trim());
    if (isHefaistiaError(result)) {
      toast.error(`Erro ao salvar chave: ${result.error}`);
    } else {
      toast.success("Chave compartilhada salva no runtime.");
      setSharedKey(""); // Limpa o input por segurança
      refreshStatus();
    }
    setSavingKey(false);
  }

  async function handleImportSnapshot() {
    if (!envelopeText.trim()) {
      toast.error("Cole o envelope JSON antes de importar.");
      return;
    }

    let envelope: KairosEnvelope;
    try {
      envelope = JSON.parse(envelopeText.trim());
    } catch {
      toast.error("O texto colado não é um JSON válido.");
      return;
    }

    if (envelope.v !== 1 || typeof envelope.iv !== "string" || typeof envelope.data !== "string") {
      toast.error(
        "O JSON colado não está no formato de envelope Kairós esperado (v: 1, iv, data).",
      );
      return;
    }

    setImporting(true);
    const result = await client.importKairosEnvelope(envelope);
    if (isHefaistiaError(result)) {
      toast.error(`Erro na importação: ${result.error}`);
    } else {
      toast.success("Snapshot decifrado e importado com sucesso!");
      setEnvelopeText("");
      refreshStatus();
    }
    setImporting(false);
  }

  return (
    <Card className="border-border bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Túnel de Kairós</CardTitle>
        <Button size="sm" variant="outline" onClick={refreshStatus} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar status"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-xs text-muted-foreground">
          O Túnel de Kairós importa manualmente um snapshot cifrado da Totalidade. Ele não faz sync
          automático, não armazena token Supabase e não escreve na Totalidade.
        </p>

        {/* Bloco de Status */}
        <div className="space-y-2 rounded-lg border border-border/40 p-3 bg-background/30">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Chave Compartilhada:</span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none ${
                status?.configured
                  ? "text-green-500 border-green-500/20 bg-green-500/10"
                  : "text-yellow-500 border-yellow-500/20 bg-yellow-500/10"
              }`}
            >
              {status?.configured ? "Configurada" : "Não configurada"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Snapshot Importado:</span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none ${
                status?.hasSnapshot
                  ? "text-green-500 border-green-500/20 bg-green-500/10"
                  : "text-muted-foreground border-muted-foreground/20 bg-muted-foreground/10"
              }`}
            >
              {status?.hasSnapshot ? "Presente" : "Ausente"}
            </span>
          </div>

          {status?.lastImportedAt && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Última Importação:</span>
              <span className="text-foreground">
                {new Date(status.lastImportedAt).toLocaleString("pt-BR")}
              </span>
            </div>
          )}

          {status?.hasSnapshot && status.counts && (
            <div className="border-t border-border/40 pt-2 mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                Identidade:{" "}
                <span className="text-foreground font-semibold">{status.counts.identidade}</span>
              </div>
              <div>
                Sedimentos:{" "}
                <span className="text-foreground font-semibold">{status.counts.sedimentos}</span>
              </div>
              <div>
                Reuniões:{" "}
                <span className="text-foreground font-semibold">{status.counts.reunioes}</span>
              </div>
              <div>
                Mensagens:{" "}
                <span className="text-foreground font-semibold">{status.counts.mensagens}</span>
              </div>
            </div>
          )}
        </div>

        {/* Configuração de Chave */}
        <div className="space-y-1.5 border-t border-border/30 pt-3">
          <Label htmlFor="kairos-shared-key">Configurar Chave Compartilhada</Label>
          <div className="flex gap-2">
            <Input
              id="kairos-shared-key"
              type="password"
              value={sharedKey}
              onChange={(e) => setSharedKey(e.target.value)}
              placeholder="Cole a chave da Totalidade..."
              className="flex-1"
            />
            <Button size="sm" onClick={handleSaveKey} disabled={savingKey}>
              {savingKey ? "Salvando..." : "Salvar chave"}
            </Button>
          </div>
        </div>

        {/* Importação de Envelope */}
        <div className="space-y-1.5 border-t border-border/30 pt-3">
          <Label htmlFor="kairos-envelope">Importar Snapshot Cifrado</Label>
          <Textarea
            id="kairos-envelope"
            value={envelopeText}
            onChange={(e) => setEnvelopeText(e.target.value)}
            placeholder='Cole o JSON {"v": 1, "iv": "...", "data": "..."} aqui...'
            className="min-h-[80px] text-xs font-mono"
          />
          <Button
            size="sm"
            onClick={handleImportSnapshot}
            disabled={importing || !status?.configured}
            className="w-full"
          >
            {importing ? "Importando..." : "Importar snapshot"}
          </Button>
          {!status?.configured && (
            <p className="text-[11px] text-yellow-500 text-center">
              ⚠️ Configure a chave compartilhada antes de tentar importar.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
