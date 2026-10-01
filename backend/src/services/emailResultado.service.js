const prisma = require("../config/prisma");
const env = require("../config/env");
const ErroHttp = require("../utils/erroHttp");
const escaparHtml = require("../utils/escaparHtml");
const sanitizarCorpoContribuicao = require("../utils/sanitizarCorpoContribuicao");
const { BLOCOS, validarBlocos, aplicarBlocos, limparVazios } = require("../utils/blocosCondicionaisEmail");
const emailService = require("./email.service");

const DECISOES = ["APROVADO", "APROVADO_COM_RESSALVAS", "APROVADO_FORMATACAO", "REPROVADO"];

// Marcadores aceitos no assunto e no corpo. No corpo os valores entram com
// escape de HTML; no assunto (texto puro) entram crus. Os trechos
// condicionais ({{#comCpf}}…{{/comCpf}}, {{#semCpf}}…{{/semCpf}}) vêm de
// utils/blocosCondicionaisEmail.js.
const MARCADORES = ["nome", "email", "titulo", "modalidade", "area", "edicao", "observacao", "prazo", "link"];

// Textos usados enquanto a organização não salvar um modelo próprio.
const MODELOS_PADRAO = {
  APROVADO: {
    assunto: "Resultado da submissão: trabalho aprovado — {{edicao}}",
    corpo:
      "<p>Olá, {{nome}}.</p><p>Temos a alegria de informar que o trabalho <strong>{{titulo}}</strong> ({{modalidade}} · {{area}}) foi <strong>aprovado</strong>.</p><p>{{observacao}}</p><p>Em breve divulgaremos as informações sobre a apresentação. Acompanhe pela sua área do participante: <a href=\"{{link}}\">{{link}}</a></p>",
  },
  APROVADO_COM_RESSALVAS: {
    assunto: "Resultado da submissão: aprovado com ressalvas — {{edicao}}",
    corpo:
      "<p>Olá, {{nome}}.</p><p>O trabalho <strong>{{titulo}}</strong> ({{modalidade}} · {{area}}) foi <strong>aprovado com ressalvas</strong>. Para confirmar a aprovação, o autor principal precisa enviar uma versão corrigida até <strong>{{prazo}}</strong>.</p><p><strong>O que deve ser ajustado:</strong> {{observacao}}</p><p>A correção é feita na área do participante, em Minhas submissões: <a href=\"{{link}}\">{{link}}</a></p>",
  },
  APROVADO_FORMATACAO: {
    assunto: "Resultado da submissão: aprovado — revise a formatação — {{edicao}}",
    corpo:
      "<p>Olá, {{nome}}.</p><p>O trabalho <strong>{{titulo}}</strong> ({{modalidade}} · {{area}}) foi <strong>aprovado</strong>. Antes da publicação, o autor principal precisa revisar a formatação do resumo e das referências bibliográficas até <strong>{{prazo}}</strong>.</p><p>{{observacao}}</p><p>A revisão é feita na área do participante, em Minhas submissões: <a href=\"{{link}}\">{{link}}</a></p>",
  },
  REPROVADO: {
    assunto: "Resultado da submissão — {{edicao}}",
    corpo:
      "<p>Olá, {{nome}}.</p><p>Agradecemos o envio do trabalho <strong>{{titulo}}</strong> ({{modalidade}} · {{area}}). Após avaliação, ele não foi selecionado para esta edição.</p><p>{{observacao}}</p><p>Esperamos contar com a sua participação no evento.</p>",
  },
};

const ROTULOS_EYEBROW = {
  APROVADO: "Trabalho aprovado",
  APROVADO_COM_RESSALVAS: "Aprovado com ressalvas",
  APROVADO_FORMATACAO: "Trabalho aprovado",
  REPROVADO: "Resultado da submissão",
};

async function listarModelos(edicaoId) {
  const salvos = await prisma.modeloEmailResultado.findMany({ where: { edicaoId } });
  return DECISOES.map((decisao) => {
    const salvo = salvos.find((modelo) => modelo.decisao === decisao);
    return salvo
      ? { decisao, assunto: salvo.assunto, corpo: salvo.corpo, personalizado: true, updatedAt: salvo.updatedAt }
      : { decisao, ...MODELOS_PADRAO[decisao], personalizado: false, updatedAt: null };
  });
}

async function salvarModelo(edicaoId, decisao, { assunto, corpo }) {
  const erroBlocos = validarBlocos(assunto) || validarBlocos(corpo);
  if (erroBlocos) throw new ErroHttp(400, erroBlocos);

  let corpoSanitizado;
  try {
    corpoSanitizado = sanitizarCorpoContribuicao(corpo);
  } catch (erro) {
    throw new ErroHttp(400, erro.message);
  }
  if (!corpoSanitizado.replace(/<[^>]*>/g, "").trim()) throw new ErroHttp(400, "Informe o texto do e-mail.");

  const modelo = await prisma.modeloEmailResultado.upsert({
    where: { edicaoId_decisao: { edicaoId, decisao } },
    create: { edicaoId, decisao, assunto, corpo: corpoSanitizado },
    update: { assunto, corpo: corpoSanitizado },
  });
  return { decisao, assunto: modelo.assunto, corpo: modelo.corpo, personalizado: true, updatedAt: modelo.updatedAt };
}

function substituir(texto, valores, { html }) {
  return texto.replace(/\{\{\s*(\w+)\s*\}\}/g, (original, chave) => {
    if (!MARCADORES.includes(chave)) return original;
    const valor = valores[chave] ?? "";
    if (!html) return String(valor);
    // Observação é texto livre de várias linhas — quebra de linha vira <br>.
    return escaparHtml(valor).replace(/\n/g, "<br />");
  });
}

// valores: { nome, email, titulo, modalidade, area, edicao, observacao, prazo, comCpf }
function renderizar(modelo, valores) {
  const completos = { ...valores, link: `${env.frontendUrl}/participante/submissoes` };
  const condicoes = { comCpf: Boolean(valores.comCpf), semCpf: !valores.comCpf };
  // Blocos antes dos marcadores; o que ficou vazio (ex.: {{observacao}} sem
  // observação, bloco removido) some. A sanitização final só normaliza tags
  // desbalanceadas quando um bloco começa num parágrafo e termina em outro —
  // os valores dos marcadores já entraram escapados.
  const corpoHtml = sanitizarCorpoContribuicao(
    limparVazios(substituir(aplicarBlocos(modelo.corpo, condicoes), completos, { html: true })),
    { limite: Infinity }
  );
  return {
    assunto: substituir(aplicarBlocos(modelo.assunto, condicoes), completos, { html: false })
      .replace(/\s{2,}/g, " ")
      .trim(),
    html: emailService.layoutEmailPublico({
      eyebrow: ROTULOS_EYEBROW[modelo.decisao],
      titulo: escaparHtml(valores.edicao),
      corpoHtml,
    }),
  };
}

async function enviarTeste(edicaoId, decisao, usuario, { comCpf = true } = {}) {
  const [modelos, edicao] = await Promise.all([
    listarModelos(edicaoId),
    prisma.edicao.findUnique({ where: { id: edicaoId }, select: { nome: true } }),
  ]);
  const modelo = modelos.find((item) => item.decisao === decisao);
  const { assunto, html } = renderizar(modelo, {
    nome: usuario.nome,
    email: usuario.email,
    titulo: "Título de exemplo do trabalho",
    modalidade: "Modalidade de exemplo",
    area: "Área de exemplo",
    edicao: edicao.nome,
    observacao: "Observação de exemplo escrita pela organização para este trabalho.",
    prazo: "31/12/2026",
    comCpf,
  });
  await emailService.enviarEmail({ para: usuario.email, assunto: `[Teste] ${assunto}`, html });
}

module.exports = { DECISOES, MARCADORES, BLOCOS, MODELOS_PADRAO, listarModelos, salvarModelo, renderizar, enviarTeste };
