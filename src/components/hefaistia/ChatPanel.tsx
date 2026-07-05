import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ResultBlock, type ResultBlockData } from "@/components/hefaistia/ResultBlock";
import {
  isHefaistiaError,
  type HefaistiaClient,
  type HefaistiaClientError,
} from "@/lib/hefaistia/client";
import type { HefaistiaHistoryItem } from "@/lib/hefaistia/local-history";
import type { KlioChatMode } from "@/lib/hefaistia/types";

const MODES: { value: KlioChatMode; label: string }[] = [
  { value: "operational", label: "Operacional" },
  { value: "explain_error", label: "Explicar erro" },
  { value: "prepare_prompt", label: "Preparar prompt" },
  { value: "review_next_step", label: "Revisar próximo passo" },
  { value: "terminal_guide", label: "Guia de terminal" },
];

function notesFromText(text: string): string[] | undefined {
  const notes = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return notes.length > 0 ? notes : undefined;
}

interface ChatPanelProps {
  client: HefaistiaClient;
  selectedModel: string;
  onAddHistory: (item: Omit<HefaistiaHistoryItem, "id" | "created_at">) => void;
}

function ModeSelect({
  value,
  onChange,
}: {
  value: KlioChatMode;
  onChange: (v: KlioChatMode) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as KlioChatMode)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MODES.map((mode) => (
          <SelectItem key={mode.value} value={mode.value}>
            {mode.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function KlioLocalTab({ client, selectedModel, onAddHistory }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<KlioChatMode>("operational");
  const [model, setModel] = useState(selectedModel);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HefaistiaClientError | null>(null);
  const [data, setData] = useState<ResultBlockData | null>(null);

  async function handleSend() {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    const response = await client.sendKlioChat({
      message,
      mode,
      model: model.trim() || undefined,
      context: notesFromText(notes) ? { notes: notesFromText(notes) } : undefined,
    });

    if (isHefaistiaError(response)) {
      setError(response);
      setLoading(false);
      return;
    }

    const resultData: ResultBlockData = {
      provider: response.provider,
      model: response.model,
      result: response.result,
      metrics: response.metrics,
      warnings: response.warnings,
    };
    setData(resultData);
    onAddHistory({
      mode: "klio-local",
      title: message.slice(0, 60),
      input: message,
      result: response.result,
    });
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="klio-message">Mensagem</Label>
        <Textarea
          id="klio-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="não entendi esse erro no terminal"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Modo</Label>
          <ModeSelect value={mode} onChange={setMode} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="klio-model">Modelo local (opcional)</Label>
          <Input
            id="klio-model"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="qwen2.5:0.5b"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="klio-notes">Notas de contexto (opcional, uma por linha)</Label>
        <Textarea
          id="klio-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
        />
      </div>
      <Button size="sm" onClick={handleSend} disabled={loading || !message.trim()}>
        {loading ? "Consultando Klio Local..." : "Enviar para Klio Local"}
      </Button>
      <ResultBlock
        loading={loading}
        loadingLabel="Consultando Klio Local..."
        error={error}
        data={data}
      />
    </div>
  );
}

function KalineFallbackTab({ client, onAddHistory }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HefaistiaClientError | null>(null);
  const [data, setData] = useState<ResultBlockData | null>(null);

  async function handleSend() {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    const response = await client.sendKalineFallback({
      message,
      reason: reason.trim() || undefined,
      context: notesFromText(notes) ? { notes: notesFromText(notes) } : undefined,
    });

    if (isHefaistiaError(response)) {
      setError(response);
      setLoading(false);
      return;
    }

    const resultData: ResultBlockData = {
      provider: response.provider,
      model: response.model,
      result: response.result,
      warnings: response.warnings,
    };
    setData(resultData);
    onAddHistory({
      mode: "kaline-fallback",
      title: message.slice(0, 60),
      input: message,
      result: response.result,
    });
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="kaline-message">Mensagem</Label>
        <Textarea
          id="kaline-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Analise esta arquitetura de PR"
          rows={3}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="kaline-reason">Motivo do fallback (opcional)</Label>
        <Input
          id="kaline-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="tarefa arquitetural complexa"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="kaline-notes">Notas de contexto (opcional, uma por linha)</Label>
        <Textarea
          id="kaline-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
        />
      </div>
      <Button size="sm" onClick={handleSend} disabled={loading || !message.trim()}>
        {loading ? "Consultando Kaline Fallback..." : "Enviar para Kaline Fallback"}
      </Button>
      <ResultBlock
        loading={loading}
        loadingLabel="Consultando Kaline Fallback..."
        error={error}
        data={data}
      />
    </div>
  );
}

function AutoTab({ client, onAddHistory }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [prefer, setPrefer] = useState<"auto" | "local" | "kaline">("auto");
  const [mode, setMode] = useState<KlioChatMode>("operational");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HefaistiaClientError | null>(null);
  const [data, setData] = useState<ResultBlockData | null>(null);

  async function handleSend() {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    const response = await client.routeTask({
      message,
      prefer,
      mode,
      context: notesFromText(notes) ? { notes: notesFromText(notes) } : undefined,
    });

    if (isHefaistiaError(response)) {
      setError(response);
      setLoading(false);
      return;
    }

    const resultData: ResultBlockData = {
      provider: response.provider,
      model: response.model,
      route: response.route,
      reason: response.reason,
      result: response.result,
      warnings: response.warnings,
    };
    setData(resultData);
    onAddHistory({
      mode: "route-task",
      title: message.slice(0, 60),
      input: message,
      result: response.result,
      metadata: { route: response.route, reason: response.reason },
    });
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="auto-message">Mensagem</Label>
        <Textarea
          id="auto-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="não entendi esse erro do terminal"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Preferência</Label>
          <Select value={prefer} onValueChange={(v) => setPrefer(v as typeof prefer)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="local">Forçar Klio Local</SelectItem>
              <SelectItem value="kaline">Forçar Kaline Fallback</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Modo</Label>
          <ModeSelect value={mode} onChange={setMode} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="auto-notes">Notas de contexto (opcional, uma por linha)</Label>
        <Textarea
          id="auto-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
        />
      </div>
      <Button size="sm" onClick={handleSend} disabled={loading || !message.trim()}>
        {loading ? "Roteando..." : "Enviar com roteamento automático"}
      </Button>
      <ResultBlock
        loading={loading}
        loadingLabel="Decidindo rota e consultando..."
        error={error}
        data={data}
      />
    </div>
  );
}

export function ChatPanel(props: ChatPanelProps) {
  return (
    <Card className="border-border bg-card/60">
      <CardHeader>
        <CardTitle className="text-base">Conversar</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="klio-local">
          <TabsList className="mb-4">
            <TabsTrigger value="klio-local">Klio Local</TabsTrigger>
            <TabsTrigger value="kaline-fallback">Kaline Fallback</TabsTrigger>
            <TabsTrigger value="auto">Auto</TabsTrigger>
          </TabsList>
          <TabsContent value="klio-local">
            <KlioLocalTab {...props} />
          </TabsContent>
          <TabsContent value="kaline-fallback">
            <KalineFallbackTab {...props} />
          </TabsContent>
          <TabsContent value="auto">
            <AutoTab {...props} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
