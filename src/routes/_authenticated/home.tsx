import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BookOpen,
  CalendarDays,
  Dumbbell,
  Feather,
  Flower2,
  Gauge,
  Gavel,
  Heart,
  Mic,
  Scale,
  Sparkle,
  Sprout,
  Users,
} from "lucide-react";
import { getHomeApps, useAuthz } from "@/lib/use-authz";
import {
  getAppGroupLabel,
  getAppStatusLabel,
  groupAppsForNavigation,
  type AppRegistryItem,
} from "@/lib/app-registry";
import { listRegistros } from "@/lib/registro-vivo.functions";
import { dueMemorias } from "@/lib/jardim.functions";
import { KittScanner, type KittState } from "@/components/KittScanner";
import { setKittPulse, useKittPulse } from "@/lib/kitt-pulse";
import { useProfile, welcomeGreeting } from "@/lib/use-profile";
import { SemaforoPresence } from "@/components/SemaforoPresence";

import {
  InlineListSkeleton,
  RouteErrorBoundary,
  RouteNotFoundBoundary,
} from "@/components/loading-states";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomeCockpit,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: () => <RouteNotFoundBoundary />,
});

const APP_ICONS: Record<string, typeof Sparkle> = {
  "kaline-chat": Sparkle,
  "kaline-presente": Mic,
  kharis: Heart,
  klio: BookOpen,
  "modo-fala-klio": Mic,
  codice: BookOpen,
  "camara-do-eco": Mic,
  kuanyin: Sparkle,
  drive: Gauge,
  "registro-vivo": Feather,
  jardim: Flower2,
  revisao: Sprout,
  agenda: CalendarDays,
  juridico: Gavel,
  legislacao: Scale,
  jurisprudencia: Gavel,
  treinos: Dumbbell,
  perfis: Users,
};

const KITT_STATES: KittState[] = [
  "idle",
  "listening",
  "transcribing",
  "thinking",
  "radar",
  "speaking",
  "unavailable",
];

function HomeCockpit() {
  const listRegs = useServerFn(listRegistros);
  const listDue = useServerFn(dueMemorias);
  const kittState: KittState = useKittPulse("idle");
  const { profile } = useProfile();
  const authz = useAuthz();
  const homeApps = getHomeApps(authz);
  const homeGroups = groupAppsForNavigation(homeApps);
  const canShowMemoryPanels = homeApps.some(
    (app) => app.id === "registro-vivo" || app.id === "jardim",
  );

  const regs = useQuery({
    queryKey: ["home-registros"],
    queryFn: () => listRegs({ data: { limit: 5 } }),
    enabled: canShowMemoryPanels,
  });
  const due = useQuery({
    queryKey: ["home-due"],
    queryFn: () => listDue({ data: { limit: 5 } }),
    enabled: canShowMemoryPanels,
  });

  const todayCount = (regs.data ?? []).filter((r) => {
    const d = new Date(r.occurred_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-[#08080E] text-[#F3EBDD]">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 pb-24 sm:px-6 sm:py-10">
        <header className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#D9A441]">
            Kaline · hub governado
          </p>
          <h1 className="serif text-3xl sm:text-4xl">{welcomeGreeting(profile?.gender ?? null)}</h1>
          {canShowMemoryPanels ? (
            <p className="max-w-2xl text-sm text-[#F3EBDD]/60">
              Hoje: <span className="text-[#F3EBDD]">{todayCount}</span> registros vivos ·{" "}
              <span className="text-[#F3EBDD]">{due.data?.length ?? 0}</span> memorias para revisar.
            </p>
          ) : (
            <p className="max-w-2xl text-sm text-[#F3EBDD]/60">
              Seu hub mostra apenas as superficies liberadas para este perfil.
            </p>
          )}
        </header>

        <SemaforoPresence defaultOpen />

        <section
          aria-label="KITT - pulso da Kaline"
          className="rounded-lg border border-white/5 bg-[#0C0B12] p-4 sm:p-5"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#F3EBDD]/55">
              {authz.isAdmin ? "KITT · teste visual do pulso" : "KITT · pulso"}
            </p>
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#C98A65]">
              {kittState}
            </span>
          </div>
          <KittScanner state={kittState} variant="ruby" height={36} />
          {authz.isAdmin && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-[#F3EBDD]/45">
                Teste visual: estes botões simulam apenas o pulso do KITT e não indicam
                processamento real.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {KITT_STATES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setKittPulse("system", s === "idle" ? null : s)}
                    className={
                      "rounded border px-2 py-1 text-[10px] uppercase tracking-[0.18em] transition " +
                      (kittState === s
                        ? "border-[#C98A65] bg-[#C98A65]/10 text-[#F3EBDD]"
                        : "border-white/10 text-[#F3EBDD]/55 hover:border-white/25 hover:text-[#F3EBDD]")
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-5 fade-up" aria-label="Superficies disponiveis">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#F3EBDD]/45">
              Superficies disponiveis
            </p>
            <p className="mt-1 text-sm text-[#F3EBDD]/55">
              Acesso organizado por dominio, permissao e status do registry.
            </p>
          </div>

          {authz.loading && <InlineListSkeleton rows={4} />}

          {!authz.loading && homeGroups.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-[#111016] p-5">
              <p className="serif text-xl text-[#F3EBDD]">Nenhuma superficie disponivel</p>
              <p className="mt-1 text-sm text-[#F3EBDD]/55">
                Nenhuma superficie disponivel para este perfil. Verifique suas permissoes ou fale
                com o administrador.
              </p>
            </div>
          )}

          {homeGroups.map((group) => (
            <section key={group.id} className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="serif text-2xl text-[#F3EBDD]">{group.label}</h2>
                  <p className="text-xs text-[#F3EBDD]/45">{group.description}</p>
                </div>
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#D9A441]/80">
                  {group.apps.length} {group.apps.length === 1 ? "entrada" : "entradas"}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.apps.map((app) => (
                  <AppHubCard key={app.id} app={app} />
                ))}
              </div>
            </section>
          ))}
        </section>

        {canShowMemoryPanels && (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-white/5 bg-[#111016] p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#F3EBDD]/55">
                  Ultimos registros
                </p>
                <Link
                  to="/registro-vivo"
                  className="text-[11px] uppercase tracking-[0.22em] text-[#C98A65] hover:text-[#D9A441]"
                >
                  abrir
                </Link>
              </div>
              {regs.isLoading && <InlineListSkeleton rows={4} />}
              {regs.data && regs.data.length === 0 && (
                <p className="text-xs italic text-[#F3EBDD]/45">
                  Nada registrado ainda. Abra uma superficie para comecar.
                </p>
              )}
              <ul className="space-y-2 fade-up">
                {(regs.data ?? []).slice(0, 5).map((r) => (
                  <li key={r.id} className="border-b border-white/5 pb-2 text-sm last:border-b-0">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#D9A441]/80">
                      <span>{r.kind}</span>
                      <span className="text-[#F3EBDD]/40">
                        {new Date(r.occurred_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[#F3EBDD]/85">{r.body}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-white/5 bg-[#111016] p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#F3EBDD]/55">
                  Para revisar hoje
                </p>
                <Link
                  to="/revisao"
                  className="text-[11px] uppercase tracking-[0.22em] text-[#C98A65] hover:text-[#D9A441]"
                >
                  revisar
                </Link>
              </div>
              {due.isLoading && <InlineListSkeleton rows={4} />}
              {due.data && due.data.length === 0 && (
                <p className="text-xs italic text-[#F3EBDD]/45">
                  Nada registrado ainda. Abra uma superficie para comecar.
                </p>
              )}
              <ul className="space-y-2 fade-up">
                {(due.data ?? []).slice(0, 5).map((m) => (
                  <li key={m.id} className="border-b border-white/5 pb-2 text-sm last:border-b-0">
                    <p className="text-[#F3EBDD]">{m.title}</p>
                    <p className="line-clamp-1 text-[11px] text-[#F3EBDD]/45">{m.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function AppHubCard({ app }: { app: AppRegistryItem }) {
  const Icon = APP_ICONS[app.id] ?? Sparkle;
  const status = app.badge ?? getAppStatusLabel(app.status);
  const domain = getAppGroupLabel(app);

  return (
    <Link
      to={app.path as never}
      className="lift-card group flex min-h-44 flex-col justify-between overflow-hidden rounded-lg border border-white/5 bg-[#111016] p-4 transition hover:border-[#C98A65]/45"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Icon className="h-5 w-5 shrink-0 text-[#C98A65]" />
          <div className="flex flex-wrap justify-end gap-1.5 text-[9px] uppercase tracking-[0.14em] text-[#F3EBDD]/50">
            <span className="rounded-full border border-white/10 px-2 py-1">{status}</span>
            {app.adminOnly && (
              <span className="rounded-full border border-[#D9A441]/30 px-2 py-1 text-[#D9A441]">
                Admin
              </span>
            )}
          </div>
        </div>
        <div>
          <h3 className="serif text-xl leading-tight text-[#F3EBDD]">
            {app.shortLabel ?? app.label}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#F3EBDD]/60">
            {app.homeDescription ?? app.description ?? `${domain} · ${app.surface}`}
          </p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em]">
        <span className="truncate text-[#F3EBDD]/45">{domain}</span>
        <span className="shrink-0 text-[#C98A65] transition group-hover:text-[#D9A441]">Abrir</span>
      </div>
    </Link>
  );
}
