export type AppDomain = "kaline" | "kharis" | "kuanyin" | "drive" | "memory" | "system";

export type AppSurface =
  | "home"
  | "kaline"
  | "kaline-presente"
  | "kharis"
  | "klio"
  | "codice"
  | "camara-do-eco"
  | "kuanyin"
  | "drive"
  | "jardim"
  | "revisao"
  | "registro-vivo"
  | "admin"
  | "profile"
  | "agenda"
  | "legal"
  | "training";

export type AppKind = "react" | "microapp-html" | "external" | "legacy" | "system";
export type AppStatus = "real" | "mock" | "legacy" | "planned" | "hidden";
export type AppNavGroup = "kaline" | "kharis" | "memory" | "kuanyin" | "drive" | "admin";
export type AccessFacet = "kaline" | "kharis" | "kuanyin" | "drive" | "klio";
export type EngineFacet = "kaline" | "kharis" | "kuanyin";
export type AppRole = "admin" | "user" | "guardian";
export type AppMode =
  | "personal"
  | "care"
  | "commercial"
  | "pedagogical"
  | "mobility"
  | "memory"
  | "system";

export type AppRegistryItem = {
  id: string;
  label: string;
  description?: string;
  path: string;
  legacyPaths?: string[];
  domain: AppDomain;
  surface: AppSurface;
  mode?: AppMode;
  /** Faceta técnica usada por motor/chat/memória/sedimentação. Importante: não adicionar "klio" aqui. */
  engineFacet?: EngineFacet;
  kind: AppKind;
  status: AppStatus;
  icon?: string;
  group?: AppNavGroup;
  groupLabel?: string;
  groupOrder?: number;
  order?: number;
  shortLabel?: string;
  homeDescription?: string;
  sidebarLabel?: string;
  badge?: string;
  sidebar?: boolean;
  home?: boolean;
  adminOnly?: boolean;
  /** Permissões/perfis que podem acessar a superfície. Aqui "klio" pode existir como permissão restrita. */
  allowedFacets?: AccessFacet[];
  allowedRoles?: AppRole[];
  children?: string[];
  parentId?: string;
  /** Define se app com status mock/legacy pode aparecer na UI. */
  exposeWhenMock?: boolean;
};

const ALL: AccessFacet[] = ["kaline", "kharis", "kuanyin", "drive", "klio"];

export const APP_NAV_GROUPS: Record<
  AppNavGroup,
  { label: string; order: number; description: string }
> = {
  kaline: {
    label: "Kaline",
    order: 10,
    description: "Presença, agenda e superfícies pessoais do shell.",
  },
  kharis: {
    label: "Kháris",
    order: 20,
    description: "Cuidado, aprendizagem e camada pedagógica Klio.",
  },
  memory: {
    label: "Memória",
    order: 30,
    description: "Registro, revisão e memória de encontros.",
  },
  kuanyin: {
    label: "Kuan-Yin",
    order: 40,
    description: "Atendimento, clientes, serviços e agenda comercial.",
  },
  drive: {
    label: "Kaline Drive",
    order: 50,
    description: "Veículo, combustível e mobilidade.",
  },
  admin: {
    label: "Administração",
    order: 90,
    description: "Configuração e governança do shell.",
  },
};

export const APP_STATUS_LABELS: Record<AppStatus, string> = {
  real: "Funcional",
  mock: "Mock visual",
  legacy: "Legado",
  planned: "Planejado",
  hidden: "Oculto",
};

export const APP_REGISTRY: AppRegistryItem[] = [
  {
    id: "home",
    label: "Home",
    description: "Hub central autenticado da Kaline.",
    path: "/home",
    domain: "kaline",
    surface: "home",
    mode: "personal",
    engineFacet: "kaline",
    kind: "system",
    status: "real",
    group: "kaline",
    order: 10,
    sidebar: true,
    home: false,
    allowedFacets: ALL,
  },
  {
    id: "kaline-chat",
    label: "Kaline",
    description: "Chat pessoal da Kaline.",
    path: "/chat",
    domain: "kaline",
    surface: "kaline",
    mode: "personal",
    engineFacet: "kaline",
    kind: "react",
    status: "real",
    group: "kaline",
    order: 20,
    homeDescription: "Conversa pessoal e continuidade no dominio Kaline.",
    sidebar: true,
    home: true,
    allowedFacets: ["kaline"],
  },
  {
    id: "kaline-presente",
    label: "Kaline Presente",
    description: "Presença por voz e escuta no domínio pessoal.",
    path: "/kaline-presente",
    domain: "kaline",
    surface: "kaline-presente",
    mode: "personal",
    engineFacet: "kaline",
    kind: "react",
    status: "real",
    group: "kaline",
    order: 30,
    homeDescription: "Presenca por voz e escuta no dominio pessoal.",
    sidebar: true,
    home: true,
    allowedFacets: ["kaline"],
  },
  {
    id: "kharis",
    label: "Kháris",
    description: "Casa visivel do cuidado, fala e aprendizagem.",
    path: "/kharis",
    domain: "kharis",
    surface: "kharis",
    mode: "care",
    engineFacet: "kharis",
    kind: "react",
    status: "real",
    group: "kharis",
    order: 10,
    homeDescription: "Casa visivel do cuidado, fala e aprendizagem.",
    sidebar: true,
    home: true,
    allowedFacets: ["kharis", "klio"],
  },
  {
    id: "klio",
    label: "Klio",
    description: "Camada pedagogica de voz e aprendizagem dentro de Kháris.",
    path: "/klio",
    domain: "kharis",
    surface: "klio",
    mode: "pedagogical",
    engineFacet: "kharis",
    kind: "react",
    status: "real",
    group: "kharis",
    order: 20,
    shortLabel: "Klio",
    homeDescription: "Voz pedagogica dentro de Kharis.",
    sidebarLabel: "Klio",
    sidebar: false,
    home: false,
    allowedFacets: ["klio", "kharis"],
    parentId: "kharis",
  },
  {
    id: "modo-fala-klio",
    label: "Modo Fala Klio",
    description: "Modo pedagógico de fala/leitura dentro de Kháris.",
    path: "/klio",
    legacyPaths: ["/modo-fala", "/klio-estudo"],
    domain: "kharis",
    surface: "klio",
    mode: "pedagogical",
    engineFacet: "kharis",
    kind: "react",
    status: "real",
    group: "kharis",
    order: 30,
    homeDescription: "Conversa simples, voz e apoio pedagogico.",
    sidebar: true,
    home: true,
    allowedFacets: ["klio", "kharis"],
    parentId: "kharis",
    exposeWhenMock: true,
  },
  {
    id: "codice",
    label: "Códice",
    description: "Leitura, margem e fichamento assistido dentro de Kháris/Klio.",
    path: "/klio/codice",
    legacyPaths: ["/livros"],
    domain: "kharis",
    surface: "codice",
    mode: "pedagogical",
    engineFacet: "kharis",
    kind: "microapp-html",
    status: "real",
    group: "kharis",
    order: 40,
    homeDescription: "Leitura, margem e fichamento assistido.",
    sidebar: true,
    home: true,
    allowedFacets: ["klio", "kharis"],
    parentId: "kharis",
  },
  {
    id: "camara-do-eco",
    label: "Câmara do Eco",
    description: "Transcrição, ata, decisões, pendências e memória de reuniões.",
    path: "/camara",
    legacyPaths: ["/camara-do-eco"],
    domain: "kaline",
    surface: "camara-do-eco",
    mode: "personal",
    engineFacet: "kaline",
    kind: "microapp-html",
    status: "real",
    group: "memory",
    order: 30,
    homeDescription: "Transcricao, ata, decisoes, pendencias e memoria de reunioes.",
    sidebar: true,
    home: true,
    allowedFacets: ["kaline"],
  },
  {
    id: "kuanyin",
    label: "Kuan-Yin",
    description: "Domínio comercial e de atendimento.",
    path: "/kuan-yin",
    domain: "kuanyin",
    surface: "kuanyin",
    mode: "commercial",
    engineFacet: "kuanyin",
    kind: "react",
    status: "real",
    group: "kuanyin",
    order: 10,
    homeDescription: "Atendimento, guardioes, clientes, servicos e agendamentos.",
    sidebar: true,
    home: true,
    allowedFacets: ["kuanyin"],
  },
  {
    id: "kuanyin-public-page",
    label: "Página pública Kuan-Yin",
    description: "Presença pública do Guardião do Negócio para clientes finais sem login.",
    path: "/g/:guardianSlug",
    domain: "kuanyin",
    surface: "kuanyin",
    mode: "commercial",
    engineFacet: "kuanyin",
    kind: "external",
    status: "real",
    group: "kuanyin",
    order: 15,
    sidebar: false,
    home: false,
    allowedFacets: ["kuanyin"],
    parentId: "kuanyin",
  },
  {
    id: "diagnostico",
    label: "Diagnóstico",
    description: "Consulta admin de eventos estruturados e trace_id.",
    path: "/admin/diagnostico",
    domain: "system",
    surface: "admin",
    mode: "system",
    kind: "system",
    status: "planned",
    group: "admin",
    order: 35,
    sidebar: false,
    home: false,
    adminOnly: true,
    allowedFacets: ALL,
  },
  {
    id: "drive",
    label: "Kaline Drive",
    description: "Mobilidade, veículo e combustível.",
    path: "/drive",
    domain: "drive",
    surface: "drive",
    mode: "mobility",
    kind: "react",
    status: "real",
    group: "drive",
    order: 10,
    homeDescription: "Veiculo, combustivel e mobilidade.",
    sidebar: true,
    home: true,
    allowedFacets: ["drive"],
  },
  {
    id: "jardim",
    label: "Jardim / Mnemósine",
    description: "Memórias aprovadas e duráveis da Kaline.",
    path: "/jardim",
    domain: "memory",
    surface: "jardim",
    mode: "memory",
    engineFacet: "kaline",
    kind: "react",
    status: "real",
    group: "memory",
    order: 10,
    homeDescription: "Memorias aprovadas e duraveis.",
    sidebar: true,
    home: true,
    allowedFacets: ["kaline", "kharis", "klio"],
  },
  {
    id: "revisao",
    label: "Revisão",
    description: "Aprovar, editar, recusar ou arquivar candidatos à memória.",
    path: "/revisao",
    domain: "memory",
    surface: "revisao",
    mode: "memory",
    engineFacet: "kaline",
    kind: "microapp-html",
    status: "real",
    group: "memory",
    order: 15,
    homeDescription: "Ritual humano dos candidatos a memoria.",
    sidebar: true,
    home: true,
    allowedFacets: ["kaline", "kharis", "klio"],
  },
  {
    id: "registro-vivo",
    label: "Registro Vivo",
    description: "Captura densa do que está vivo no dia.",
    path: "/registro-vivo",
    domain: "memory",
    surface: "registro-vivo",
    mode: "memory",
    engineFacet: "kaline",
    kind: "react",
    status: "real",
    group: "memory",
    order: 20,
    homeDescription: "Captura densa do que esta vivo no dia.",
    sidebar: true,
    home: true,
    allowedFacets: ["kaline", "kharis", "klio"],
  },

  {
    id: "agenda",
    label: "Agenda",
    description: "Compromissos e organização.",
    path: "/agenda",
    domain: "kaline",
    surface: "agenda",
    mode: "personal",
    engineFacet: "kaline",
    kind: "microapp-html",
    status: "real",
    group: "kaline",
    order: 40,
    homeDescription: "Compromissos e organizacao.",
    sidebar: true,
    home: true,
    allowedFacets: ["kaline"],
  },
  {
    id: "juridico",
    label: "Jurídico",
    description: "Corpus jurídico curado.",
    path: "/juridico",
    domain: "kaline",
    surface: "legal",
    mode: "personal",
    engineFacet: "kaline",
    kind: "microapp-html",
    status: "real",
    group: "kaline",
    order: 50,
    homeDescription: "Corpus juridico curado.",
    sidebar: true,
    home: true,
    allowedFacets: ["kaline"],
  },
  {
    id: "legislacao",
    label: "Legislação",
    path: "/legislacao",
    domain: "kaline",
    surface: "legal",
    mode: "personal",
    engineFacet: "kaline",
    kind: "microapp-html",
    status: "real",
    group: "kaline",
    order: 60,
    homeDescription: "Busca assistida por IA — confira as fontes oficiais.",
    sidebar: true,
    home: true,
    allowedFacets: ["kaline"],
  },
  {
    id: "jurisprudencia",
    label: "Jurisprudência",
    path: "/jurisprudencia",
    domain: "kaline",
    surface: "legal",
    mode: "personal",
    engineFacet: "kaline",
    kind: "microapp-html",
    status: "real",
    group: "kaline",
    order: 70,
    homeDescription: "Busca assistida por IA — confira tribunal e número.",
    sidebar: true,
    home: true,
    allowedFacets: ["kaline"],
  },
  {
    // Travessia em camadas de uma conversa (sedimentação). Acessada a partir do
    // chat, não navegável pela sidebar/home — registrada para satisfazer o
    // invariante do registry e liberar acesso a usuários não-admin.
    id: "trilha",
    label: "Trilha",
    description: "Travessia em camadas de uma conversa.",
    path: "/trilha",
    domain: "kaline",
    surface: "kaline",
    mode: "personal",
    engineFacet: "kaline",
    kind: "react",
    status: "real",
    group: "kaline",
    order: 999,
    sidebar: false,
    home: false,
    allowedFacets: ["kaline"],
  },
  {
    id: "corpore-sano",
    label: "Corpore Sano",
    description: "Treino, sinais corporais e recuperação.",
    path: "/corpore-sano",
    legacyPaths: ["/treinos"],
    domain: "kaline",
    surface: "training",
    mode: "personal",
    engineFacet: "kaline",
    kind: "microapp-html",
    status: "real",
    group: "kaline",
    order: 80,
    homeDescription: "Mente clara. Corpo atento. Disciplina sem violência.",
    sidebar: true,
    home: true,
    allowedFacets: ["kaline"],
  },
  {
    id: "perfil",
    label: "Meu perfil",
    path: "/perfil",
    domain: "system",
    surface: "profile",
    mode: "system",
    kind: "system",
    status: "real",
    group: "admin",
    order: 80,
    sidebar: true,
    home: false,
    allowedFacets: ALL,
  },
  {
    id: "perfis",
    label: "Guardião",
    path: "/perfis",
    domain: "system",
    surface: "admin",
    mode: "system",
    kind: "system",
    status: "real",
    group: "admin",
    order: 10,
    sidebarLabel: "Guardião",
    homeDescription: "Configuração operacional da IA e acessos.",
    sidebar: true,
    home: true,
    adminOnly: true,
    allowedFacets: ALL,
  },
  {
    id: "facetas",
    label: "Facetas",
    path: "/facetas",
    domain: "system",
    surface: "admin",
    mode: "system",
    kind: "system",
    status: "real",
    group: "admin",
    order: 20,
    sidebarLabel: "Facetas",
    sidebar: true,
    home: false,
    adminOnly: true,
    allowedFacets: ALL,
  },
  ...[
    "/kuan-yin/showroom",
    "/kuan-yin/clientes",
    "/kuan-yin/guardioes",
    "/kuan-yin/config",
    "/kuan-yin/onboarding",
    "/kuan-yin/pedidos",
    "/kuan-yin/agendamentos",
    "/kuan-yin/pagamentos",
  ].map((path) => ({
    id: path.slice(1).replaceAll("/", "-"),
    label: path.split("/").at(-1) ?? path,
    path,
    domain: "kuanyin" as const,
    surface: "kuanyin" as const,
    mode: "commercial" as const,
    engineFacet: "kuanyin" as const,
    kind: "react" as const,
    status: "real" as const,
    sidebar: false,
    home: false,
    allowedFacets: ["kuanyin"] as AccessFacet[],
    parentId: "kuanyin",
  })),
  ...[
    "/identidade",
    "/klio/codice/acervo",
    "/klio/codice/subir",
    "/klio/codice/margem",
    "/klio/codice/fichamento",
    "/klio/codice/tela-acesa",
  ].map((path) => ({
    id: path.slice(1).replaceAll("/", "-"),
    label: path,
    path,
    domain: path.startsWith("/klio") ? ("kharis" as const) : ("system" as const),
    surface: path.startsWith("/klio") ? ("codice" as const) : ("admin" as const),
    mode: path.startsWith("/klio") ? ("pedagogical" as const) : ("system" as const),
    engineFacet: path.startsWith("/klio") ? ("kharis" as const) : ("kaline" as const),
    kind: "react" as const,
    status: "real" as const,
    sidebar: false,
    home: false,
    allowedFacets: (path.startsWith("/klio") ? ["klio", "kharis"] : ["kaline"]) as AccessFacet[],
    parentId: path.startsWith("/klio") ? "codice" : undefined,
  })),
];

export function getAppById(id: string) {
  return APP_REGISTRY.find((app) => app.id === id);
}
export function getAppByPath(path: string) {
  return APP_REGISTRY.find((app) => app.path === path || path.startsWith(app.path + "/"));
}
export function resolveLegacyPath(path: string): string | null {
  const app = APP_REGISTRY.find((item) => item.legacyPaths?.includes(path));
  return app && app.path !== path ? app.path : null;
}
export function isAppVisible(app: AppRegistryItem): boolean {
  if (app.status === "hidden") return false;
  if (app.status === "real") return true;
  return app.exposeWhenMock === true;
}
export function getAppStatusLabel(status: AppStatus): string {
  return APP_STATUS_LABELS[status];
}
export function getAppGroupId(app: AppRegistryItem): AppNavGroup {
  if (app.group) return app.group;
  if (app.adminOnly || app.domain === "system") return "admin";
  if (app.domain === "kuanyin") return "kuanyin";
  if (app.domain === "drive") return "drive";
  if (app.domain === "memory") return "memory";
  if (app.domain === "kharis") return "kharis";
  return "kaline";
}
export function getAppGroupLabel(appOrGroup: AppRegistryItem | AppNavGroup): string {
  if (typeof appOrGroup === "string") return APP_NAV_GROUPS[appOrGroup].label;
  return appOrGroup.groupLabel ?? APP_NAV_GROUPS[getAppGroupId(appOrGroup)].label;
}
export function getAppGroupDescription(group: AppNavGroup): string {
  return APP_NAV_GROUPS[group].description;
}
export function getAppGroupOrder(app: AppRegistryItem): number {
  return app.groupOrder ?? APP_NAV_GROUPS[getAppGroupId(app)].order;
}
export function sortRegistryApps(apps: AppRegistryItem[]): AppRegistryItem[] {
  return [...apps].sort((a, b) => {
    const groupDiff = getAppGroupOrder(a) - getAppGroupOrder(b);
    if (groupDiff !== 0) return groupDiff;
    const orderDiff = (a.order ?? 100) - (b.order ?? 100);
    if (orderDiff !== 0) return orderDiff;
    return a.label.localeCompare(b.label, "pt-BR");
  });
}
export function groupAppsForNavigation(apps: AppRegistryItem[]) {
  const groups = new Map<
    AppNavGroup,
    {
      id: AppNavGroup;
      label: string;
      description: string;
      order: number;
      apps: AppRegistryItem[];
    }
  >();

  for (const app of sortRegistryApps(apps)) {
    const id = getAppGroupId(app);
    if (!groups.has(id)) {
      groups.set(id, {
        id,
        label: getAppGroupLabel(app),
        description: getAppGroupDescription(id),
        order: getAppGroupOrder(app),
        apps: [],
      });
    }
    groups.get(id)?.apps.push(app);
  }

  return [...groups.values()].sort((a, b) => a.order - b.order);
}
export function getSidebarRegistryApps() {
  return sortRegistryApps(APP_REGISTRY.filter((app) => app.sidebar && isAppVisible(app)));
}
export function getHomeRegistryApps() {
  return sortRegistryApps(APP_REGISTRY.filter((app) => app.home && isAppVisible(app)));
}
export function getChildrenOfApp(parentId: string) {
  return sortRegistryApps(
    APP_REGISTRY.filter((app) => app.parentId === parentId && isAppVisible(app)),
  );
}
