import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { LazyMarkdown } from "@/components/LazyMarkdown";
import {
  isHefaistiaError,
  type HefaistiaClient,
  type HefaistiaClientError,
} from "@/lib/hefaistia/client";
import type { HefaistiaHistoryItem } from "@/lib/hefaistia/local-history";
import type {
  DailyExportResult,
  TotalidadeExportResult,
  TotalidadeTypeSuggestion,
} from "@/lib/hefaistia/types";

interface DailyExportPanelProps {
  client: HefaistiaClient;
  onAddHistory: (item: Omit<HefaistiaHistoryItem, "id" | "created_at">) => void;
}

function linesToItems(text: string): string[] | undefined {
  const items = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

async function copyMarkdown(markdown: string) {
  try {
    await navigator.clipboard.writeText(markdown);
    toast.success("Markdown copiado.");
  } catch {
    toast.error("Não foi possível copiar automaticamente. Selecione o texto manualmente.");
  }
}

function DiarioTab({ client, onAddHistory }: DailyExportPanelProps) {
  const [summary, setSummary] = useState("");
  const [decisions, setDecisions] = useState("");
  const [problems, setProblems] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HefaistiaClientError | null>(null);
  const [result, setResult] = useState<DailyExportResult | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);

    const response = await client.exportDailyContext({
      summary: summary.trim() || undefined,
      decisions: linesToItems(decisions),
      problems: linesToItems(problems),
      next_steps: linesToItems(nextSteps),
      notes_for_totalidade: linesToItems(notes),
    });

    if (isHefaistiaError(response)) {
      setError(response);
      setLoading(false);
      return;
    }

    setResult(response);
    onAddHistory({
      mode: "daily-export",
      title: response.filename,
      result: response.markdown,
    });
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="export-summary">Resumo operacional</Label>
        <Textarea
          id="export-summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="export-decisions">Decisões tomadas (uma por linha)</Label>
        <Textarea
          id="export-decisions"
          value={decisions}
          onChange={(event) => setDecisions(event.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="export-problems">Problemas encontrados (uma por linha)</Label>
        <Textarea
          id="export-problems"
          value={problems}
          onChange={(event) => setProblems(event.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="export-next-steps">Próximos passos sugeridos (uma por linha)</Label>
        <Textarea
          id="export-next-steps"
          value={nextSteps}
          onChange={(event) => setNextSteps(event.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="export-notes">Observações para a Kaline Totalidade (uma por linha)</Label>
        <Textarea
          id="export-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
        />
      </div>

      <Button size="sm" onClick={handleGenerate} disabled={loading}>
        {loading ? "Gerando..." : "Gerar contexto diário"}
      </Button>

      {error ? <p className="whitespace-pre-line text-sm text-destructive">{error.error}</p> : null}

      {result ? (
        <div className="space-y-2 rounded-md border border-border bg-background/40 p-3">
          <p className="text-xs text-muted-foreground">arquivo: {result.filename}</p>
          <div className="max-h-72 overflow-y-auto text-sm [&_p]:mb-2">
            <LazyMarkdown>{result.markdown}</LazyMarkdown>
          </div>
          <Button size="sm" variant="outline" onClick={() => copyMarkdown(result.markdown)}>
            Copiar Markdown
          </Button>
          <p className="text-xs text-muted-foreground">
            Este conteúdo não foi salvo na Totalidade. Revise, copie e cole manualmente na Kaline
            Totalidade se quiser sedimentar.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function TotalidadeTab({ client, onAddHistory }: DailyExportPanelProps) {
  const [typeSuggestion, setTypeSuggestion] =
    useState<TotalidadeTypeSuggestion>("memoria_relacional");
  const [whatHappened, setWhatHappened] = useState("");
  const [confirmedDecisions, setConfirmedDecisions] = useState("");
  const [observedPreferences, setObservedPreferences] = useState("");
  const [technicalState, setTechnicalState] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<HefaistiaClientError | null>(null);
  const [result, setResult] = useState<TotalidadeExportResult | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);

    const response = await client.exportTotalidadeContext({
      type_suggestion: typeSuggestion,
      what_happened: whatHappened.trim() || undefined,
      confirmed_decisions: linesToItems(confirmedDecisions),
      observed_preferences: linesToItems(observedPreferences),
      technical_state: linesToItems(technicalState),
      next_steps: linesToItems(nextSteps),
    });

    if (isHefaistiaError(response)) {
      setError(response);
      setLoading(false);
      return;
    }

    setResult(response);
    onAddHistory({
      mode: "daily-export",
      title: response.filename,
      result: response.markdown,
    });
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Tipo sugerido</Label>
        <Select
          value={typeSuggestion}
          onValueChange={(value) => setTypeSuggestion(value as TotalidadeTypeSuggestion)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="identidade">Identidade</SelectItem>
            <SelectItem value="memoria_relacional">Memória relacional</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="totalidade-what-happened">O que aconteceu</Label>
        <Textarea
          id="totalidade-what-happened"
          value={whatHappened}
          onChange={(event) => setWhatHappened(event.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="totalidade-decisions">Decisões confirmadas por Ká (uma por linha)</Label>
        <Textarea
          id="totalidade-decisions"
          value={confirmedDecisions}
          onChange={(event) => setConfirmedDecisions(event.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="totalidade-preferences">Preferências observadas (uma por linha)</Label>
        <Textarea
          id="totalidade-preferences"
          value={observedPreferences}
          onChange={(event) => setObservedPreferences(event.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="totalidade-technical-state">
          Estado técnico da Hefaístia (uma por linha)
        </Label>
        <Textarea
          id="totalidade-technical-state"
          value={technicalState}
          onChange={(event) => setTechnicalState(event.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="totalidade-next-steps">Próximos passos (uma por linha)</Label>
        <Textarea
          id="totalidade-next-steps"
          value={nextSteps}
          onChange={(event) => setNextSteps(event.target.value)}
          rows={2}
        />
      </div>

      <Button size="sm" onClick={handleGenerate} disabled={loading}>
        {loading ? "Gerando..." : "Gerar bloco para Totalidade"}
      </Button>

      {error ? <p className="whitespace-pre-line text-sm text-destructive">{error.error}</p> : null}

      {result ? (
        <div className="space-y-2 rounded-md border border-border bg-background/40 p-3">
          <p className="text-xs text-muted-foreground">arquivo: {result.filename}</p>
          <div className="max-h-72 overflow-y-auto text-sm [&_p]:mb-2">
            <LazyMarkdown>{result.markdown}</LazyMarkdown>
          </div>
          <Button size="sm" variant="outline" onClick={() => copyMarkdown(result.markdown)}>
            Copiar bloco para Totalidade
          </Button>
          <p className="text-xs text-muted-foreground">
            Nada foi enviado automaticamente. Revise e cole manualmente na Kaline Totalidade.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function DailyExportPanel(props: DailyExportPanelProps) {
  return (
    <Card className="border-border bg-card/60">
      <CardHeader>
        <CardTitle className="text-base">Export</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="diario">
          <TabsList className="mb-4">
            <TabsTrigger value="diario">Diário</TabsTrigger>
            <TabsTrigger value="totalidade">Totalidade</TabsTrigger>
          </TabsList>
          <TabsContent value="diario">
            <DiarioTab {...props} />
          </TabsContent>
          <TabsContent value="totalidade">
            <TotalidadeTab {...props} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
