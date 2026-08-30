// Fonte única de rótulos/seções usada pelo seletor de permissões
// (SeletorSecoesAdmin.jsx). Os valores espelham o enum SecaoAdmin do
// backend (prisma/schema.prisma) e os rótulos/agrupamento espelham
// NavegacaoEdicao.jsx — ao adicionar uma seção nova em um dos dois lugares,
// espelhe aqui também.
export const GRUPOS_SECOES_ADMIN = [
  {
    titulo: "Gestão",
    itens: [{ valor: "PARTICIPANTES", rotulo: "Usuários e Participantes" }],
  },
  {
    titulo: "Pré-evento",
    itens: [
      { valor: "ATIVIDADES", rotulo: "Atividades" },
      { valor: "COMISSOES", rotulo: "Comissões" },
      {
        rotulo: "Página do evento",
        subitens: [
          { valor: "PAGINA_EVENTO", rotulo: "Hero + Navbar" },
          { valor: "PAGINA_APRESENTACAO", rotulo: "Apresentação" },
          { valor: "PAGINA_MODALIDADES", rotulo: "Modalidades" },
          { valor: "PAGINA_AGENDA", rotulo: "Agenda/Programação" },
          { valor: "PAGINA_PUBLICACOES", rotulo: "Publicações" },
          { valor: "PAGINA_COMISSOES", rotulo: "Comissões" },
          { valor: "PAGINA_REALIZADORES", rotulo: "Realizadores" },
          { valor: "PAGINA_APOIO", rotulo: "Apoio" },
          { valor: "PAGINA_CONTRIBUICAO", rotulo: "Contribuição" },
          { valor: "PAGINA_LOCALIZACAO", rotulo: "Localização" },
        ],
      },
      { valor: "PROGRAMACAO", rotulo: "Programação" },
      {
        rotulo: "Submissões",
        subitens: [
          { valor: "SUBMISSOES_MODALIDADES", rotulo: "Modalidades de submissão" },
          { valor: "SUBMISSOES_RECEBIMENTO", rotulo: "Recebimento" },
          { valor: "SUBMISSOES_AVALIACAO", rotulo: "Avaliação" },
          { valor: "SUBMISSOES_RESULTADO", rotulo: "Resultado" },
          { valor: "SUBMISSOES_APRESENTACAO", rotulo: "Apresentação" },
          { valor: "SUBMISSOES_PUBLICACAO", rotulo: "Publicação" },
        ],
      },
    ],
  },
  {
    titulo: "Inscrições",
    itens: [
      { valor: "INSCRICOES_GERAIS", rotulo: "Inscrições gerais" },
      { valor: "INSCRICOES_ATIVIDADES", rotulo: "Inscrições em atividades" },
    ],
  },
  {
    titulo: "Evento",
    itens: [{ valor: "CREDENCIAMENTO", rotulo: "Credenciamento" }],
  },
  {
    titulo: "Pós-evento",
    itens: [{ valor: "CERTIFICADOS", rotulo: "Certificados" }],
  },
  {
    titulo: "Configurações",
    itens: [
      { valor: "CONFIGURACOES_EVENTO", rotulo: "Evento" },
      { valor: "TIPOS_ATIVIDADE", rotulo: "Tipos de atividade" },
      { valor: "TIPOS_PARTICIPACAO", rotulo: "Tipos de participação" },
      { valor: "TIPOS_PONTO_INTERESSE", rotulo: "Tipos de ponto de referência" },
      { valor: "TIPOS_COMISSAO", rotulo: "Tipos de comissão" },
    ],
  },
];

// Lookup plano valor -> rótulo, derivado de GRUPOS_SECOES_ADMIN — usado
// onde só o rótulo de uma seção isolada é necessário (ex.: listar as
// seções liberadas de um organizador).
export const ROTULOS_SECOES_ADMIN = GRUPOS_SECOES_ADMIN.reduce((mapa, grupo) => {
  for (const item of grupo.itens) {
    if (item.subitens) {
      for (const sub of item.subitens) mapa[sub.valor] = sub.rotulo;
    } else {
      mapa[item.valor] = item.rotulo;
    }
  }
  return mapa;
}, {});
