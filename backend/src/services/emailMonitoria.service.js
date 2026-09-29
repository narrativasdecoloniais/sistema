const env = require("../config/env");
const escaparHtml = require("../utils/escaparHtml");
const { layoutEmailPublico } = require("./email.service");

// Textos fixos do resultado da seleção de monitoria, um por situação
// (CANCELADA e EM_ANALISE não recebem e-mail). Todo valor interpolado passa
// por escaparHtml.
const PARAGRAFO = 'style="margin: 0 0 14px; font-size: 15px; line-height: 1.6;"';

const TEXTOS = {
  SELECIONADO: {
    titulo: "Você foi selecionado(a)",
    corpo: ({ edicao }) =>
      `Temos a alegria de informar que você foi <strong>selecionado(a)</strong> para a monitoria voluntária do ${edicao}. Em breve a Coordenação de Monitoria entrará em contato com as orientações sobre a formação e a designação das atividades.`,
  },
  LISTA_ESPERA: {
    titulo: "Você está na lista de espera",
    corpo: ({ edicao, posicao }) =>
      `Sua inscrição para a monitoria voluntária do ${edicao} ficou na <strong>lista de espera</strong>${
        posicao ? `, na <strong>posição ${posicao}</strong>` : ""
      }. Caso surjam vagas, a Coordenação de Monitoria entrará em contato seguindo a ordem da lista.`,
  },
  NAO_SELECIONADO: {
    titulo: "Resultado da seleção",
    corpo: ({ edicao }) =>
      `Agradecemos muito o seu interesse. Desta vez não foi possível selecionar a sua inscrição para a monitoria voluntária do ${edicao}. Esperamos contar com a sua participação no evento.`,
  },
};

function renderizar({ status, nome, edicao, posicao, edicaoId }) {
  const texto = TEXTOS[status];
  if (!texto) throw new Error(`Situação sem e-mail de resultado: ${status}`);

  const link = `${env.frontendUrl}/participante/monitoria/${edicaoId}`;
  const corpoHtml = `
    <p ${PARAGRAFO}>Olá, ${escaparHtml(nome)}.</p>
    <p ${PARAGRAFO}>${texto.corpo({ edicao: escaparHtml(edicao), posicao })}</p>
    <p ${PARAGRAFO}>Você pode acompanhar a sua inscrição na área do participante: <a href="${link}">${link}</a></p>
  `;

  return {
    assunto: `Monitoria — resultado da seleção (${edicao})`,
    html: layoutEmailPublico({ eyebrow: "Monitoria", titulo: texto.titulo, corpoHtml }),
  };
}

module.exports = { renderizar, STATUS_COM_EMAIL: Object.keys(TEXTOS) };
