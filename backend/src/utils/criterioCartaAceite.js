const { DECISOES_PUBLICAVEIS, DECISOES_COM_CORRECAO, filtroDecisao } = require("./criterioAnais");

// Quem tem direito à carta de aceite numa edição — configurado em Submissões ›
// Carta de aceite (Edicao.cartaAceiteDecisoes/cartaAceiteExigirCorrecao),
// com as mesmas opções do critério dos Anais (criterioAnais.js): só decisões
// de aprovação e, se exigido, ressalvas/formatação com a correção concluída.

const DECISOES_CARTA = DECISOES_PUBLICAVEIS;

const CRITERIO_PADRAO = {
  decisoes: ["APROVADO", "APROVADO_COM_RESSALVAS", "APROVADO_FORMATACAO"],
  exigirCorrecaoConcluida: true,
};

const SELECT_CRITERIO_CARTA = { cartaAceiteDecisoes: true, cartaAceiteExigirCorrecao: true };

function criterioCartaDe(edicao) {
  return {
    decisoes: edicao?.cartaAceiteDecisoes ?? CRITERIO_PADRAO.decisoes,
    exigirCorrecaoConcluida: edicao?.cartaAceiteExigirCorrecao ?? CRITERIO_PADRAO.exigirCorrecaoConcluida,
  };
}

// Filtro Prisma de Submissao.
function filtroCartaAceite(edicao) {
  const { decisoes, exigirCorrecaoConcluida } = criterioCartaDe(edicao);
  return filtroDecisao({ decisoesPublicadas: decisoes, exigirCorrecaoConcluida });
}

// O mesmo, num registro já carregado (Minhas submissões).
function atendeCriterioCarta(submissao, edicao) {
  const { decisoes, exigirCorrecaoConcluida } = criterioCartaDe(edicao);
  if (!DECISOES_CARTA.includes(submissao.decisaoFinal) || !decisoes.includes(submissao.decisaoFinal)) return false;
  if (exigirCorrecaoConcluida && DECISOES_COM_CORRECAO.includes(submissao.decisaoFinal)) {
    return submissao.statusCorrecao === "CONCLUIDA";
  }
  return true;
}

module.exports = {
  DECISOES_CARTA,
  CRITERIO_PADRAO,
  SELECT_CRITERIO_CARTA,
  criterioCartaDe,
  filtroCartaAceite,
  atendeCriterioCarta,
};
