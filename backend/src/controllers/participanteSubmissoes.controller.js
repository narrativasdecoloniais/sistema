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
      apresentacaoPublicadaEm: true,
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
    apresentacao:
      edicao.apresentacaoPublicadaEm && submissao.atividadeApresentacao
        ? { atividade: submissao.atividadeApresentacao, ordem: submissao.ordemApresentacao }
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
  corrigir,
  criar,
  verificarEmailAutor,
  reenviarConviteCoautor,
};
