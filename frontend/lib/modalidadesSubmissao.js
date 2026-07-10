import { AREAS_TEMATICAS_CONVERSATORIOS } from "./areasTematicasConversatorios";

// Dados das modalidades de submissão da edição corrente. Hoje são fixos aqui
// porque o painel administrativo (módulo 2) ainda não existe; quando ele for
// construído, este arquivo dá lugar a uma chamada à API — por isso a section
// e a página de detalhe navegam por slug, e não por um enum fixo de nomes.
export const MODALIDADES_SUBMISSAO = [
  {
    slug: "conversatorios",
    nome: "Conversatórios",
    subtitulo: "Resumo Expandido",
    prazoInicio: "2026-05-13",
    prazoFim: "2026-07-30",
    resumoCurto:
      "Espaços decoloniais e interculturais de intercâmbio de experiências e debates teóricos, conduzidos em roda de conversa, com metodologias participativas e dialógicas.",
    perguntaTitulo: "O que é uma sessão Conversatório?",
    descricao: [
      "As Sessões Conversatórios constituem espaços decoloniais e interculturais para o intercâmbio de experiências e debates teóricos transdisciplinares em torno de grandes temas correlatos à temática geral do evento. Assim, os Conversatórios são conduzidos a partir de metodologias participativas e dialógicas, de modo a assegurar a circularidade da palavra e a horizontalidade das trocas.",
      "Diferentemente dos formatos comumente adotados em eventos acadêmicos, aqui as autoras e os autores serão convidadas/os a compartilharem suas experiências, pesquisas e reflexões teóricas em uma grande roda de conversa.",
    ],
    linkRotulo: "Saiba mais",
    // Nas modalidades com área temática detalhada (hoje só Conversatórios), a
    // listagem exibida na página é derivada dos dados completos de cada área
    // — a mesma fonte usada na página de detalhe — para não duplicar título.
    areasTematicas: AREAS_TEMATICAS_CONVERSATORIOS.map((area) => ({
      slug: area.slug,
      numero: area.numero,
      titulo: area.titulo,
    })),
  },
  {
    slug: "narrativas-multimodais",
    nome: "Narrativas Multimodais de Experiências",
    subtitulo: null,
    prazoInicio: "2026-05-13",
    prazoFim: "2026-07-30",
    resumoCurto:
      "Formas de produção de conhecimento que articulam múltiplas linguagens — podcast, vídeo, fotografia — para relatos situados de práticas, experiências e ações educativas.",
    perguntaTitulo: "O que são Narrativas Multimodais de Experiência?",
    descricao: [
      "As Narrativas Multimodais de Experiências constituem formas de produção de conhecimento que deslocam a centralidade da escrita acadêmica, articulando múltiplas linguagens — como podcast, vídeo e fotografia — na elaboração de relatos situados. Ancoradas em perspectivas decoloniais, partem do reconhecimento da experiência vivida como locus epistemológico legítimo e das linguagens multimodais como dispositivos de enunciação capazes de expressar dimensões sensíveis, corporais, territoriais e coletivas do conhecimento.",
      "Nesse sentido, operam como práticas de sistematização que tensionam hierarquias epistêmicas, ampliando as formas de narrar, refletir e validar saberes. Podem contemplar práticas educativas, ações comunitárias e de extensão, trajetórias individuais e coletivas, bem como experiências de diálogo de saberes, desde que alinhadas às temáticas do evento. Serão aceitos trabalhos em língua portuguesa e espanhola.",
    ],
    linkRotulo: "Saiba mais",
    areasTematicas: null,
  },
];

export function buscarModalidadeSubmissao(slug) {
  return MODALIDADES_SUBMISSAO.find((modalidade) => modalidade.slug === slug) ?? null;
}

export function formatarPeriodoSubmissao(dataInicioIso, dataFimIso) {
  const formatador = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
  return `${formatador.format(new Date(dataInicioIso))} – ${formatador.format(new Date(dataFimIso))}`;
}
