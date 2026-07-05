import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isHefaistiaError, type HefaistiaClientError } from "@/lib/hefaistia/client";
import type { HefaistiaHealth } from "@/lib/hefaistia/types";

interface SettingsPanelProps {
  apiUrl: string;
  token: string;
  selectedModel: string;
  onChangeApiUrl: (value: string) => void;
  onChangeToken: (value: string) => void;
  onChangeModel: (value: string) => void;
  onRestoreDefaults: () => void;
  onTestConnection: () => void;
  testing: boolean;
  testResult: HefaistiaHealth | HefaistiaClientError | null;
}

export function SettingsPanel({
  apiUrl,
  token,
  selectedModel,
  onChangeApiUrl,
  onChangeToken,
  onChangeModel,
  onRestoreDefaults,
  onTestConnection,
  testing,
  testResult,
}: SettingsPanelProps) {
  return (
    <Card className="border-border bg-card/60">
      <CardHeader>
        <CardTitle className="text-base">Configurações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-1.5">
          <Label htmlFor="hefaistia-api-url">API URL</Label>
          <Input
            id="hefaistia-api-url"
            value={apiUrl}
            onChange={(event) => onChangeApiUrl(event.target.value)}
            placeholder="http://127.0.0.1:4518"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hefaistia-token">Token local</Label>
          <Input
            id="hefaistia-token"
            value={token}
            onChange={(event) => onChangeToken(event.target.value)}
            placeholder="dev-local"
          />
          <p className="text-xs text-muted-foreground">
            Token local não é senha de internet; é só proteção do runtime local.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hefaistia-selected-model">Modelo selecionado</Label>
          <Input
            id="hefaistia-selected-model"
            value={selectedModel}
            onChange={(event) => onChangeModel(event.target.value)}
            placeholder="qwen2.5:0.5b"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onTestConnection} disabled={testing}>
            {testing ? "Testando..." : "Testar conexão"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onRestoreDefaults}>
            Restaurar padrão
          </Button>
        </div>

        {testResult ? (
          isHefaistiaError(testResult) ? (
            <p className="text-xs text-destructive">{testResult.error}</p>
          ) : (
            <p className="text-xs text-drive">
              Conectado — Ollama {testResult.ollama}, Héstia {testResult.hestia}.
            </p>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
