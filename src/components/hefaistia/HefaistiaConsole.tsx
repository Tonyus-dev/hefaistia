import { useCallback, useEffect, useMemo, useState } from "react";

import { BenchmarkPanel } from "@/components/hefaistia/BenchmarkPanel";
import { ChatPanel } from "@/components/hefaistia/ChatPanel";
import { DailyExportPanel } from "@/components/hefaistia/DailyExportPanel";
import { HistoryPanel } from "@/components/hefaistia/HistoryPanel";
import { HowToStartCard } from "@/components/hefaistia/HowToStartCard";
import { KnowledgePanel } from "@/components/hefaistia/KnowledgePanel";
import { ModelPanel } from "@/components/hefaistia/ModelPanel";
import { SessionPanel } from "@/components/hefaistia/SessionPanel";
import { SettingsPanel } from "@/components/hefaistia/SettingsPanel";
import { StatusPanel } from "@/components/hefaistia/StatusPanel";
import {
  createHefaistiaClient,
  isHefaistiaError,
  type HefaistiaClientError,
} from "@/lib/hefaistia/client";
import {
  DEFAULT_KLIO_TOKEN,
  HEFAISTIA_API_URL,
  HEFAISTIA_STORAGE_KEYS,
} from "@/lib/hefaistia/config";
import {
  addHistoryItem,
  clearHistory,
  getHistory,
  type HefaistiaHistoryItem,
} from "@/lib/hefaistia/local-history";
import type { HefaistiaHealth, KnowledgeList, OllamaModelsResponse } from "@/lib/hefaistia/types";

function readStorage(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

function portFromUrl(url: string): string {
  try {
    return new URL(url).port || "4518";
  } catch {
    return "4518";
  }
}

export function HefaistiaConsole() {
  const [apiUrl, setApiUrl] = useState(() =>
    readStorage(HEFAISTIA_STORAGE_KEYS.apiUrl, HEFAISTIA_API_URL),
  );
  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined" && window.location.hash.startsWith("#token=")) {
      const parsedToken = window.location.hash.slice("#token=".length);
      if (parsedToken) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        window.localStorage.setItem(HEFAISTIA_STORAGE_KEYS.token, parsedToken);
        return parsedToken;
      }
    }
    return readStorage(HEFAISTIA_STORAGE_KEYS.token, DEFAULT_KLIO_TOKEN);
  });
  const [selectedModel, setSelectedModel] = useState(() =>
    readStorage(HEFAISTIA_STORAGE_KEYS.selectedModel, ""),
  );
  const [history, setHistory] = useState<HefaistiaHistoryItem[]>(() => getHistory());

  useEffect(() => {
    window.localStorage.setItem(HEFAISTIA_STORAGE_KEYS.apiUrl, apiUrl);
  }, [apiUrl]);

  useEffect(() => {
    window.localStorage.setItem(HEFAISTIA_STORAGE_KEYS.token, token);
  }, [token]);

  useEffect(() => {
    window.localStorage.setItem(HEFAISTIA_STORAGE_KEYS.selectedModel, selectedModel);
  }, [selectedModel]);

  const client = useMemo(() => createHefaistiaClient({ apiUrl, token }), [apiUrl, token]);

  const [health, setHealth] = useState<HefaistiaHealth | HefaistiaClientError | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [knowledge, setKnowledge] = useState<KnowledgeList | HefaistiaClientError | null>(null);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [models, setModels] = useState<OllamaModelsResponse | HefaistiaClientError | null>(null);
  const [loadedModels, setLoadedModels] = useState<
    OllamaModelsResponse | HefaistiaClientError | null
  >(null);
  const [modelsLoading, setModelsLoading] = useState(false);

  const refreshHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealth(await client.getHealth());
    setHealthLoading(false);
  }, [client]);

  const refreshKnowledge = useCallback(async () => {
    setKnowledgeLoading(true);
    setKnowledge(await client.getKnowledge());
    setKnowledgeLoading(false);
  }, [client]);

  const refreshModels = useCallback(async () => {
    setModelsLoading(true);
    const [modelsResult, loadedResult] = await Promise.all([
      client.getModels(),
      client.getLoadedModels(),
    ]);
    setModels(modelsResult);
    setLoadedModels(loadedResult);
    setModelsLoading(false);
  }, [client]);

  useEffect(() => {
    refreshHealth();
    refreshKnowledge();
    refreshModels();
  }, [refreshHealth, refreshKnowledge, refreshModels]);

  function handleAddHistory(item: Omit<HefaistiaHistoryItem, "id" | "created_at">) {
    setHistory(addHistoryItem(item));
  }

  function handleClearHistory() {
    setHistory(clearHistory());
  }

  function handleRestoreDefaults() {
    setApiUrl(HEFAISTIA_API_URL);
    setToken(DEFAULT_KLIO_TOKEN);
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-1 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            porta {portFromUrl(apiUrl)}
          </p>
          <h1 className="serif text-4xl text-klio">Klio Hefaístia</h1>
          <p className="text-muted-foreground">Console Visual da Forja</p>
        </header>

        {isHefaistiaError(health) && health.code === "RUNTIME_OFFLINE" ? (
          <HowToStartCard apiUrl={apiUrl} />
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-6">
            <StatusPanel
              apiUrl={apiUrl}
              health={health}
              loading={healthLoading}
              onRefresh={refreshHealth}
              knowledgeCount={
                !isHefaistiaError(knowledge) && knowledge ? knowledge.items.length : null
              }
              selectedModel={selectedModel}
            />
            <SessionPanel client={client} />
            <SettingsPanel
              apiUrl={apiUrl}
              token={token}
              selectedModel={selectedModel}
              onChangeApiUrl={setApiUrl}
              onChangeToken={setToken}
              onChangeModel={setSelectedModel}
              onRestoreDefaults={handleRestoreDefaults}
              onTestConnection={refreshHealth}
              testing={healthLoading}
              testResult={health}
            />
            <KnowledgePanel
              data={knowledge}
              loading={knowledgeLoading}
              onRefresh={refreshKnowledge}
            />
            <ModelPanel
              client={client}
              modelsData={models}
              loadedData={loadedModels}
              loading={modelsLoading}
              onRefresh={refreshModels}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
            />
          </div>

          <div className="space-y-6">
            <ChatPanel
              client={client}
              selectedModel={selectedModel}
              onAddHistory={handleAddHistory}
            />
            <BenchmarkPanel
              client={client}
              selectedModel={selectedModel}
              onAddHistory={handleAddHistory}
            />
            <DailyExportPanel client={client} onAddHistory={handleAddHistory} />
            <HistoryPanel history={history} onClear={handleClearHistory} />
          </div>
        </div>
      </div>
    </main>
  );
}
