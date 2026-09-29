const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const prisma = require("../config/prisma");
const INCLUDE_PADRAO = require("../utils/submissaoIncludePadrao");
const { prazoCorrecaoAberto } = require("../utils/prazoCorrecao");
const {
  criarSubmissaoSchema,
  verificarEmailAutorSchema,
  correcaoSubmissaoSchema,
} = require("../validators/submissoes.validators");
const usuariosService = require("../services/usuarios.service");
const edicoesService = require("../services/edicoes.service");
const submissoesService = require("../services/submissoes.service");

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
    },
  },
  atividadeApresentacao: {
    select: { id: true, nome: true, slug: true, local: true, inicioAtividade: true, fimAtividade: true },
  },
};

// Projeção explícita: decisão, observação e correção só aparecem depois que
// a organização divulga o resultado da edição — antes disso nada vaza.
function formatarParaParticipante(submissao, usuarioId, { completa = false } = {}) {
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
    autores: submissao.autores.map((autor) => ({ id: autor.id, nome: autor.nome, principal: autor.principal })),
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
            ehAutorPrincipal && prazoAberto && ["PENDENTE", "DEVOLVIDA"].includes(submissao.statusCorrecao),
        }
      : null,
  };
}

const listarMinhas = asyncHandler(async (req, res) => {
  const submissoes = await prisma.submissao.findMany({
    where: { autores: { some: { usuarioId: req.usuario.id } } },
    include: INCLUDE_PARTICIPANTE,
    orderBy: { createdAt: "desc" },
  });
  return res.json({ submissoes: submissoes.map((submissao) => formatarParaParticipante(submissao, req.usuario.id)) });
});

const buscar = asyncHandler(async (req, res) => {
  const submissao = await prisma.submissao.findFirst({
    where: { id: req.params.id, autores: { some: { usuarioId: req.usuario.id } } },
    include: INCLUDE_PARTICIPANTE,
  });
  if (!submissao) throw new ErroHttp(404, "Submissão não encontrada.");
  return res.json({ submissao: formatarParaParticipante(submissao, req.usuario.id, { completa: true }) });
});

const corrigir = asyncHandler(async (req, res) => {
  const dados = correcaoSubmissaoSchema.parse(req.body);
  await submissoesService.corrigirSubmissao(req.usuario.id, req.params.id, dados);
  const submissao = await prisma.submissao.findUnique({ where: { id: req.params.id }, include: INCLUDE_PARTICIPANTE });
  return res.json({ submissao: formatarParaParticipante(submissao, req.usuario.id, { completa: true }) });
});

const criar = asyncHandler(async (req, res) => {
  const dados = criarSubmissaoSchema.parse(req.body);
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");

  const submissao = await submissoesService.criarSubmissao(req.usuario.id, edicao.id, dados);
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
  corrigir,
  criar,
  verificarEmailAutor,
};
