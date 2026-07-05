import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface HowToStartCardProps {
  apiUrl: string;
}

async function copyText(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Não foi possível copiar automaticamente. Selecione o texto manualmente.");
  }
}

export function HowToStartCard({ apiUrl }: HowToStartCardProps) {
  const [open, setOpen] = useState(false);
  const consoleUrl =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";

  return (
    <Card className="border-kaline/40 bg-kaline/5">
      <CardHeader>
        <CardTitle className="text-base">A Forja local ainda não está ligada</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Nenhum runtime respondeu em <code className="text-foreground">{apiUrl}</code>. Para ligar
          a Forja no modo simples, rode em um terminal:
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded bg-background/60 px-2 py-1 text-xs">bun run hefaistia</code>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyText("bun run hefaistia", "Comando copiado.")}
          >
            Copiar comando
          </Button>
        </div>
        <p className="text-muted-foreground">Depois abra este console em:</p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded bg-background/60 px-2 py-1 text-xs">{consoleUrl}</code>
          <Button size="sm" variant="outline" onClick={() => copyText(consoleUrl, "URL copiada.")}>
            Copiar URL
          </Button>
        </div>

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button size="sm" variant="ghost" className="gap-1">
              Ver instruções
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2 text-xs text-muted-foreground">
            <p>
              1. Em um terminal, na raiz do projeto: `bun run hefaistia` (ou `node
              server/hefaistia.mjs`).
            </p>
            <p>2. Deixe esse terminal aberto — é o runtime local da Hefaístia.</p>
            <p>
              3. Verifique o status a qualquer momento com{" "}
              <code className="text-foreground">bash scripts/status-hefaistia.sh</code>.
            </p>
            <p>
              4. Se preferir instalar um atalho de menu, rode{" "}
              <code className="text-foreground">bash scripts/install-local.sh</code> — ver README.
            </p>
            <p>
              A Hefaístia ainda não é um app autônomo (tipo Tauri/Electron): o atalho abre este
              console no navegador, e o runtime precisa estar rodando.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
