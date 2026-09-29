import { formatarPeriodoAtividade } from "@/lib/publico";

// Página pública da atividade: rota por edição quando ela tem slug (vale
// para edições passadas), senão a rota da edição atual.
export function linkAtividade(edicao, atividade) {
  return edicao?.slug ? `/edicoes/${edicao.slug}/atividades/${atividade.slug}` : `/atividades/${atividade.slug}`;
}

// "Dia e horário · local" de uma atividade (sem o nome) — usado na tela de
// Apresentação e em Minhas submissões.
export function detalheAtividade(atividade) {
  return [formatarPeriodoAtividade(atividade.inicioAtividade, atividade.fimAtividade), atividade.local]
    .filter(Boolean)
    .join(" · ");
}
