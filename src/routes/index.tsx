import { createFileRoute } from "@tanstack/react-router";
import { HefaistiaHome } from "@/components/HefaistiaHome";

// A home local abre direto, sem sessão, sem Supabase e sem redirecionamento
// para /auth. Desde o PR 4, a home é o Console Visual da Forja — depende de
// localStorage e de fetch para o runtime local, então roda só no cliente
// (mesmo padrão de outras rotas que leem estado local do navegador).
export const Route = createFileRoute("/")({
  ssr: false,
  component: HefaistiaHome,
});
