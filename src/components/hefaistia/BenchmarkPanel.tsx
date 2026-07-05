import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResultBlock, type ResultBlockData } from "@/components/hefaistia/ResultBlock";
import {
  isHefaistiaError,
  type HefaistiaClient,
  type HefaistiaClientError,
} from "@/lib/hefaistia/client";
import type { HefaistiaHistoryItem } from "@/lib/hefaistia/local-history";

interface BenchmarkPanelProps {
  client: HefaistiaClient;
  selectedModel: string;
  onAddHistory: (item: Omit<HefaistiaHistoryItem, "id" | "created_at">) => void;
}

export function BenchmarkPanel({ client, selectedModel, onAddHistory }: BenchmarkPanelProps) {
  const [model, setModel] = useState(selectedModel);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<HefaistiaClientError | null>(null);
  const [data, setData] = useState<ResultBlockData | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setData(null);

    const response = await client.runBenchmark(model.trim() || undefined);

    if (isHefaistiaError(response)) {
      setError(response);
      setRunning(false);
      return;
    }

    const resultData: ResultBlockData = {
      model: response.model,
      result: response.response,
      metrics: response.metrics,
      warnings: response.warnings,
    };
    setData(resultData);
    onAddHistory({
      mode: "benchmark",
      title: `Benchmark ${response.model}`,
      result: response.response,
      metadata: { metrics: response.metrics },
    });
    setRunning(false);
  }

  return (
    <Card className="border-border bg-card/60">
      <CardHeader>
        <CardTitle className="text-base">Benchmark</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="space-y-1.5">
          <Label htmlFor="benchmark-model">Modelo</Label>
          <Input
            id="benchmark-model"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="qwen2.5-coder:7b"
          />
        </div>

        <Button size="sm" onClick={handleRun} disabled={running}>
          {running ? "Rodando benchmark..." : "Rodar benchmark"}
        </Button>

        <ResultBlock
          loading={running}
          loadingLabel="Rodando benchmark — pode demorar em hardware legado..."
          error={error}
          data={data}
        />
      </CardContent>
    </Card>
  );
}
