const prisma = require("../config/prisma");
const env = require("../config/env");
const ErroHttp = require("../utils/erroHttp");
const escaparHtml = require("../utils/escaparHtml");
const sanitizarCorpoContribuicao = require("../utils/sanitizarCorpoContribuicao");
const emailService = require("./email.service");

// Aviso de apresentação (apresentacaoSubmissoes.service.js): texto editável
// pela organização, um por edição. Marcadores espelhados em
// frontend/lib/emailApresentacao.js — mudou um, muda o outro. No corpo os
// valores entram com escape de HTML; no assunto (texto puro), crus. O botão
// "Ver a atividade" entra sempre depois do texto, fora do modelo.
const MARCADORES = [
  "nome",
  "primeiroNome",
  "email",
  "titulo",
  "atividade",
  "dataHorario",
  "local",
  "edicao",
  "linkAtividade",
  "linkSubmissoes",
];

const PADRAO_MARCADOR = /\{\{\s*(\w+)\s*\}\}/g;

// Usado enquanto a organização não salvar um texto próprio — o mesmo
// conteúdo do aviso antes de ele ser editável.
const MODELO_PADRAO = {
  assunto: "Apresentação do seu trabalho — {{edicao}}",
  corpo:
    "<p>Olá, {{nome}}.</p><p>O trabalho <strong>{{titulo}}</strong> será apresentado na atividade:</p><p><strong>{{atividade}}</strong><br>{{dataHorario}}<br>Local: {{local}}</p><p>Essas informações também ficam em Minhas submissões, na sua área do participante: <a href=\"{{linkSubmissoes}}\">{{linkSubmissoes}}</a></p>",
};

function marcadoresDesconhecidos(texto) {
  const encontrados = [...String(texto).matchAll(PADRAO_MARCADOR)].map((resultado) => resultado[1]);
  return [...new Set(encontrados.filter((chave) => !MARCADORES.includes(chave)))];
}

function substituir(texto, valores, { html }) {
  return String(texto).replace(PADRAO_MARCADOR, (original, chave) => {
    if (!MARCADORES.includes(chave)) return original;
    const valor = String(valores[chave] ?? "");
    return html ? escaparHtml(valor) : valor;
  });
}

// O que ficou vazio depois da troca (ex.: parágrafo só com {{local}} numa
// atividade sem local) some do e-mail.
function limparVazios(html) {
  return html.replace(/<p>(\s|<br\s*\/?>)*<\/p>/g, "");
}

const formatadorDia = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

function hora(data) {
  const horas = data.getUTCHours();
  const minutos = data.getUTCMinutes();
  return minutos === 0 ? `${horas}h` : `${horas}h${String(minutos).padStart(2, "0")}`;
}

// "quarta-feira, 03/12, das 14h às 18h" — datas "ingênuas" (horário de
// Brasília gravado como UTC), formatadas em UTC.
function formatarDataHorario(inicioIso, fimIso) {
  const inicio = new Date(inicioIso);
  const fim = new Date(fimIso);
  const mesmoDia = inicio.toISOString().slice(0, 10) === fim.toISOString().slice(0, 10);
  return mesmoDia
    ? `${formatadorDia.format(inicio)}, das ${hora(inicio)} às ${hora(fim)}`
    : `de ${formatadorDia.format(inicio)}, ${hora(inicio)}, a ${formatadorDia.format(fim)}, ${hora(fim)}`;
}

function linkDaAtividade(edicao, atividade) {
  return edicao.slug
    ? `${env.frontendUrl}/edicoes/${edicao.slug}/atividades/${atividade.slug}`
    : `${env.frontendUrl}/atividades/${atividade.slug}`;
}

// autor: { nome, email }; edicao: { nome, slug }; trabalho: { titulo };
// atividade: { nome, slug, local, inicioAtividade, fimAtividade }.
function valoresPara(autor, { edicao, trabalho, atividade }) {
  const nome = String(autor.nome || "").trim();
  return {
    nome,
    primeiroNome: nome.split(/\s+/)[0] || "",
    email: autor.email || "",
    titulo: trabalho.titulo,
    atividade: atividade.nome,
    dataHorario: formatarDataHorario(atividade.inicioAtividade, atividade.fimAtividade),
    local: atividade.local || "a definir",
    edicao: edicao.nome,
    linkAtividade: linkDaAtividade(edicao, atividade),
    linkSubmissoes: `${env.frontendUrl}/participante/submissoes`,
  };
}

async function buscarModelo(edicaoId) {
  const salvo = await prisma.modeloEmailApresentacao.findUnique({ where: { edicaoId } });
  return salvo
    ? { assunto: salvo.assunto, corpo: salvo.corpo, personalizado: true, updatedAt: salvo.updatedAt }
    : { ...MODELO_PADRAO, personalizado: false, updatedAt: null };
}

async function salvarModelo(edicaoId, { assunto, corpo }) {
  const desconhecidos = [...new Set([...marcadoresDesconhecidos(assunto), ...marcadoresDesconhecidos(corpo)])];
  if (desconhecidos.length > 0) {
    throw new ErroHttp(400, `Marcador desconhecido: ${desconhecidos.map((chave) => `{{${chave}}}`).join(", ")}.`);
  }

  let corpoSanitizado;
  try {
    corpoSanitizado = sanitizarCorpoContribuicao(corpo);
  } catch (erro) {
    throw new ErroHttp(400, erro.message);
  }
  if (!corpoSanitizado.replace(/<[^>]*>/g, "").trim()) throw new ErroHttp(400, "Informe o texto do e-mail.");

  const modelo = await prisma.modeloEmailApresentacao.upsert({
    where: { edicaoId },
    create: { edicaoId, assunto, corpo: corpoSanitizado },
    update: { assunto, corpo: corpoSanitizado },
  });
  return { assunto: modelo.assunto, corpo: modelo.corpo, personalizado: true, updatedAt: modelo.updatedAt };
}

async function restaurarPadrao(edicaoId) {
  await prisma.modeloEmailApresentacao.deleteMany({ where: { edicaoId } });
  return buscarModelo(edicaoId);
}

function renderizar(modelo, valores) {
  // A sanitização final só normaliza o HTML — os valores já entraram escapados.
  const corpoHtml = sanitizarCorpoContribuicao(limparVazios(substituir(modelo.corpo, valores, { html: true })), {
    limite: Infinity,
  });
  return {
    assunto: substituir(modelo.assunto, valores, { html: false }).replace(/\s{2,}/g, " ").trim(),
    html: emailService.layoutEmailPublico({
      eyebrow: "Apresentação de trabalho",
      titulo: escaparHtml(valores.edicao),
      corpoHtml: `${corpoHtml}${emailService.botaoEmail(valores.linkAtividade, "Ver a atividade")}`,
    }),
  };
}

async function enviarTeste(edicaoId, usuario) {
  const [modelo, edicao] = await Promise.all([
    buscarModelo(edicaoId),
    prisma.edicao.findUnique({ where: { id: edicaoId }, select: { nome: true, slug: true } }),
  ]);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
  const { assunto, html } = renderizar(
    modelo,
    valoresPara(usuario, {
      edicao,
      trabalho: { titulo: "Título de exemplo do trabalho" },
      atividade: {
        nome: "Atividade de exemplo",
        slug: "atividade-de-exemplo",
        local: "Auditório de exemplo",
        inicioAtividade: "2026-12-03T14:00:00.000Z",
        fimAtividade: "2026-12-03T18:00:00.000Z",
      },
    })
  );
  await emailService.enviarEmail({ para: usuario.email, assunto: `[Teste] ${assunto}`, html });
}

module.exports = { MARCADORES, MODELO_PADRAO, buscarModelo, salvarModelo, restaurarPadrao, renderizar, valoresPara, enviarTeste };
