const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const prisma = require("../config/prisma");
const INCLUDE_PADRAO = require("../utils/submissaoIncludePadrao");
const { prazoCorrecaoAberto, correcaoEditavel } = require("../utils/prazoCorrecao");
const {
  criarSubmissaoSchema,
  verificarEmailAutorSchema,
  correcaoSubmissaoSchema,
} = require("../validators/submissoes.validators");
const usuariosService = require("../services/usuarios.service");
const edicoesService = require("../services/edicoes.service");
const submissoesService = require("../services/submissoes.service");
const convitesCoautorService = require("../services/convitesCoautor.service");
const anaisService = require("../services/anais.service");
const certificadosService = require("../services/certificados.service");
const { SELECT_CRITERIO_CARTA, atendeCriterioCarta } = require("../utils/criterioCartaAceite");
const { enviarPdf } = require("./certificados.controller");

const INCLUDE_PARTICIPANTE = {
  ...INCLUDE_PADRAO,
  edicao: {
    select: {
      id: true,
      nome: true,
      numero: true,
      slug: true,
      resultadoDivulgadoEm: true,
      prazoCorrecaoSubmissao: true,
      ...SELECT_CRITERIO_CARTA,
      apresentacaoPublicadaEm: true,
      apresentacaoOutrosTrabalhosEm: true,
      anais: { select: { publicadoEm: true } },
    },
  },
  atividadeApresentacao: {
    select: { id: true, nome: true, slug: true, local: true, inicioAtividade: true, fimAtividade: true },
  },
};

// Projeção explícita: decisão, observação e correção só aparecem depois que
// a organização divulga o resultado da edição — antes disso nada vaza.
// convites: mapa de ConviteCoautor por e-mail — só o autor principal vê se
// cada coautor já se cadastrou (coautores veem só os nomes).
function formatarParaParticipante(submissao, usuarioId, { completa = false, convites = new Map() } = {}) {
  const { edicao } = submissao;
  const divulgado = Boolean(edicao.resultadoDivulgadoEm);
  const ehAutorPrincipal = submissao.usuarioId === usuarioId;
  const prazoAberto = prazoCorrecaoAberto(edicao.prazoCorrecaoSubmissao);

  return {
    id: submissao.id,
    titulo: submissao.titulo,
    createdAt: submissao.createdAt,
    edicao: { id: edicao.id, nome: edicao.nome, numero: edicao.numero, slug: edicao.slug },
    modalidadeSubmissao: submissao.modalidadeSubmissao,
    areaSubmissao: submissao.areaSubmissao,
    autores: submissao.autores.map((autor) => ({
      id: autor.id,
      nome: autor.nome,
      principal: autor.principal,
      ...(ehAutorPrincipal && !autor.principal ? { cadastro: situacaoCadastro(autor, convites) } : {}),
    })),
    ehAutorPrincipal,
    ...(completa ? { resumo: submissao.resumo, referenciaBibliografica: submissao.referenciaBibliografica } : {}),
    // Onde/quando apresenta — só depois que a distribuição é publicada.
    // outrosTrabalhosVisiveis: a organização liberou ver os demais trabalhos
    // da mesma atividade (GET /participante/submissoes/:id/atividade).
    apresentacao:
      edicao.apresentacaoPublicadaEm && submissao.atividadeApresentacao
        ? {
            atividade: submissao.atividadeApresentacao,
            outrosTrabalhosVisiveis: Boolean(edicao.apresentacaoOutrosTrabalhosEm),
          }
        : null,
    resultado: divulgado
      ? {
          decisao: submissao.decisaoFinal,
          observacao: submissao.observacaoResultado,
          statusCorrecao: submissao.statusCorrecao,
          motivoDevolucao: submissao.motivoDevolucao,
          prazoCorrecao: edicao.prazoCorrecaoSubmissao,
          prazoAberto,
          podeCorrigir:
            ehAutorPrincipal &&
            correcaoEditavel(submissao, { ...edicao, anaisPublicados: Boolean(edicao.anais?.publicadoEm) }),
          // Mesma regra do tipo CARTA_ACEITE (certificadosElegiveis.js).
          cartaAceiteDisponivel: ehAutorPrincipal && atendeCriterioCarta(submissao, edicao),
        }
      : null,
  };
}

function situacaoCadastro(autor, convites) {
  const { situacao, enviadoEm } = convitesCoautorService.situacaoAutoria(autor, convites);
  return { situacao, enviadoEm };
}

// Convites dos coautores soltos das submissões em que a pessoa é a autora
// principal.
async function convitesDasSubmissoes(submissoes, usuarioId) {
  const emails = submissoes
    .filter((submissao) => submissao.usuarioId === usuarioId)
    .flatMap((submissao) => submissao.autores.filter((autor) => !autor.principal && !autor.usuarioId))
    .map((autor) => autor.email);
  return convitesCoautorService.mapaConvites(emails);
}

const listarMinhas = asyncHandler(async (req, res) => {
  const submissoes = await prisma.submissao.findMany({
    where: { autores: { some: { usuarioId: req.usuario.id } } },
    include: INCLUDE_PARTICIPANTE,
    orderBy: { createdAt: "desc" },
  });
  const convites = await convitesDasSubmissoes(submissoes, req.usuario.id);
  return res.json({
    submissoes: submissoes.map((submissao) => formatarParaParticipante(submissao, req.usuario.id, { convites })),
  });
});

const reenviarConviteCoautor = asyncHandler(async (req, res) => {
  await convitesCoautorService.reenviarPeloAutorPrincipal(req.usuario.id, req.params.id, req.params.autorId);
  return res.json({ mensagem: "Convite enviado ao coautor." });
});

const buscar = asyncHandler(async (req, res) => {
  const submissao = await prisma.submissao.findFirst({
    where: { id: req.params.id, autores: { some: { usuarioId: req.usuario.id } } },
    include: INCLUDE_PARTICIPANTE,
  });
  if (!submissao) throw new ErroHttp(404, "Submissão não encontrada.");
  const convites = await convitesDasSubmissoes([submissao], req.usuario.id);
  return res.json({ submissao: formatarParaParticipante(submissao, req.usuario.id, { completa: true, convites }) });
});

// Trabalhos da atividade em que a submissão da pessoa vai ser apresentada,
// na ordem de apresentação — só com a distribuição liberada para os autores
// e os outros trabalhos liberados pela organização. Autores só com nome
// (sem e-mail), como na página pública da atividade.
const trabalhosDaAtividade = asyncHandler(async (req, res) => {
  const submissao = await prisma.submissao.findFirst({
    where: { id: req.params.id, autores: { some: { usuarioId: req.usuario.id } } },
    select: {
      atividadeApresentacao: INCLUDE_PARTICIPANTE.atividadeApresentacao,
      edicao: { select: { slug: true, apresentacaoPublicadaEm: true, apresentacaoOutrosTrabalhosEm: true } },
    },
  });
  if (!submissao) throw new ErroHttp(404, "Submissão não encontrada.");
  const { edicao, atividadeApresentacao: atividade } = submissao;
  if (!edicao.apresentacaoPublicadaEm || !edicao.apresentacaoOutrosTrabalhosEm || !atividade) {
    throw new ErroHttp(404, "Os trabalhos desta atividade não estão disponíveis.");
  }

  const trabalhos = await prisma.submissao.findMany({
    where: { atividadeApresentacaoId: atividade.id },
    select: {
      id: true,
      titulo: true,
      resumo: true,
      referenciaBibliografica: true,
      ordemApresentacao: true,
      modalidadeSubmissao: { select: { id: true, nome: true } },
      areaSubmissao: { select: { id: true, titulo: true } },
      autores: { select: { nome: true, principal: true }, orderBy: { ordem: "asc" } },
    },
    orderBy: [{ ordemApresentacao: "asc" }, { titulo: "asc" }],
  });
  return res.json({
    edicao: { slug: edicao.slug },
    atividade,
    trabalhos: trabalhos.map((trabalho) => ({ ...trabalho, proprio: trabalho.id === req.params.id })),
  });
});

// Carta de aceite (PDF) — só o autor principal, trabalho no critério da carta.
const cartaAceite = asyncHandler(async (req, res) => {
  return enviarPdf(res, await certificadosService.pdfCartaAceite(req.usuario.id, req.params.id));
});

// Prévia da página do trabalho nos Anais, com o layout público.
const previa = asyncHandler(async (req, res) => {
  return res.json(await anaisService.buscarPreviaArtigo(req.usuario.id, req.params.id));
});

const corrigir = asyncHandler(async (req, res) => {
  const dados = correcaoSubmissaoSchema.parse(req.body);
  await submissoesService.corrigirSubmissao(req.usuario.id, req.params.id, dados);
  const submissao = await prisma.submissao.findUnique({ where: { id: req.params.id }, include: INCLUDE_PARTICIPANTE });
  const convites = await convitesDasSubmissoes([submissao], req.usuario.id);
  return res.json({ submissao: formatarParaParticipante(submissao, req.usuario.id, { completa: true, convites }) });
});

const criar = asyncHandler(async (req, res) => {
  const dados = criarSubmissaoSchema.parse(req.body);
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");

  const submissao = await submissoesService.criarSubmissao(req.usuario.id, edicao.id, dados);
  convitesCoautorService.convidarCoautoresDaSubmissao(submissao.id);
  return res.status(201).json({ submissao });
});

const verificarEmailAutor = asyncHandler(async (req, res) => {
  const dados = verificarEmailAutorSchema.parse(req.body);
  const nome = await usuariosService.buscarNomePublicoPorEmail(dados.email);
  return res.json({ nome });
});

module.exports = {
  listarMinhas,
  buscar,
  previa,
  trabalhosDaAtividade,
  cartaAceite,
  corrigir,
  criar,
  verificarEmailAutor,
  reenviarConviteCoautor,
};
