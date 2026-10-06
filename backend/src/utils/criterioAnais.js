// Critérios de quais submissões podem ficar públicas — toda consulta pública
// de trabalhos (Anais) passa por aqui. O critério é configurado por edição em
// AnaisEdicao (Configurações dos Anais); edição sem configuração salva usa o
// padrão abaixo, que é o critério que antes ficava fixo no código.

const DECISOES_PUBLICAVEIS = ["APROVADO", "APROVADO_COM_RESSALVAS", "APROVADO_FORMATACAO"];
// Decisões que pedem correção/revisão do autor principal.
const DECISOES_COM_CORRECAO = ["APROVADO_COM_RESSALVAS", "APROVADO_FORMATACAO"];
const CREDENCIAMENTOS_ANAIS = ["NAO_EXIGIR", "ALGUM_AUTOR", "AUTOR_PRINCIPAL"];

const CRITERIO_PADRAO = {
  decisoesPublicadas: ["APROVADO_FORMATACAO"],
  exigirCorrecaoConcluida: false,
  credenciamentoExigido: "ALGUM_AUTOR",
};

// Para os selects de AnaisEdicao que só precisam do critério.
const SELECT_CRITERIO_ANAIS = { decisoesPublicadas: true, exigirCorrecaoConcluida: true, credenciamentoExigido: true };

function criterioDe(anais) {
  return {
    decisoesPublicadas: anais?.decisoesPublicadas ?? CRITERIO_PADRAO.decisoesPublicadas,
    exigirCorrecaoConcluida: anais?.exigirCorrecaoConcluida ?? CRITERIO_PADRAO.exigirCorrecaoConcluida,
    credenciamentoExigido: anais?.credenciamentoExigido ?? CRITERIO_PADRAO.credenciamentoExigido,
  };
}

// Autoria (SubmissaoAutor) cuja conta se credenciou no evento da edição.
// Coautor sem conta não tem como ter se credenciado.
function autoriaCredenciada(edicaoId) {
  return { usuario: { inscricoesEdicao: { some: { edicaoId, credenciadoEm: { not: null } } } } };
}

function filtroDecisao({ decisoesPublicadas, exigirCorrecaoConcluida }) {
  const decisoes = decisoesPublicadas.filter((decisao) => DECISOES_PUBLICAVEIS.includes(decisao));
  if (!exigirCorrecaoConcluida) return { decisaoFinal: { in: decisoes } };
  return {
    OR: [
      { decisaoFinal: { in: decisoes.filter((decisao) => !DECISOES_COM_CORRECAO.includes(decisao)) } },
      {
        decisaoFinal: { in: decisoes.filter((decisao) => DECISOES_COM_CORRECAO.includes(decisao)) },
        statusCorrecao: "CONCLUIDA",
      },
    ],
  };
}

function filtroCredenciamento(edicaoId, credenciamentoExigido) {
  if (credenciamentoExigido === "AUTOR_PRINCIPAL") {
    return { autores: { some: { principal: true, ...autoriaCredenciada(edicaoId) } } };
  }
  if (credenciamentoExigido === "ALGUM_AUTOR") return { autores: { some: autoriaCredenciada(edicaoId) } };
  return null;
}

// anais: o registro AnaisEdicao da edição (ou só os campos do critério);
// null/undefined = critério padrão.
function filtroSubmissoesAnais(edicaoId, anais) {
  const criterio = criterioDe(anais);
  return {
    AND: [filtroDecisao(criterio), filtroCredenciamento(edicaoId, criterio.credenciamentoExigido)].filter(Boolean),
  };
}

module.exports = {
  DECISOES_PUBLICAVEIS,
  CREDENCIAMENTOS_ANAIS,
  CRITERIO_PADRAO,
  SELECT_CRITERIO_ANAIS,
  filtroSubmissoesAnais,
};
