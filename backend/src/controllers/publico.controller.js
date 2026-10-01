const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const edicoesService = require("../services/edicoes.service");
const atividadesService = require("../services/atividades.service");
const modalidadesSubmissaoService = require("../services/modalidadesSubmissao.service");
const gruposConteudoService = require("../services/gruposConteudo.service");
const certificadosService = require("../services/certificados.service");
const prisma = require("../config/prisma");
const inscricoesAbertas = require("../utils/inscricoesAbertas");
const inscricoesMonitoriaAbertas = require("../utils/inscricoesMonitoriaAbertas");
const { filtroTrabalhosAprovadosPublicos } = require("../utils/criterioAnais");

// Link "Anais" da navegação aponta para /anais/<slug> quando os Anais da
// edição estão publicados. Consulta à parte (e tolerante a falha) pra nunca
// derrubar a página da edição por causa dos Anais.
async function anaisPublicados(edicaoId) {
  try {
    const anais = await prisma.anaisEdicao.findUnique({ where: { edicaoId }, select: { publicadoEm: true } });
    return Boolean(anais?.publicadoEm);
  } catch (erro) {
    console.error("[publico] falha ao consultar os Anais da edição:", erro.message);
    return false;
  }
}

// Janelas calculadas no backend pra o site público mostrar/esconder os
// botões de inscrição sem repetir as regras.
async function comJanelas(edicao) {
  return {
    ...edicao,
    inscricoesAbertas: inscricoesAbertas(edicao),
    monitoriaAberta: inscricoesMonitoriaAbertas(edicao),
    anaisPublicados: await anaisPublicados(edicao.id),
  };
}

const buscarEdicaoAtual = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");
  return res.json({ edicao: await comJanelas(edicao) });
});

const listarEdicoesAnteriores = asyncHandler(async (req, res) => {
  const atual = await edicoesService.buscarEdicaoAtual();
  const edicoes = atual ? await edicoesService.listarEdicoesAnteriores(atual.numero) : [];
  return res.json({ edicoes });
});

const buscarEdicaoPorSlug = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarPorSlug(req.params.slug);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
  return res.json({ edicao: await comJanelas(edicao) });
});

const listarAtividadesPorEdicaoSlug = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarPorSlug(req.params.slug);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
  const atividades = await atividadesService.listarAtividades(edicao.id);
  atividades.sort((a, b) => a.nome.localeCompare(b.nome));
  return res.json({ atividades });
});

// Trabalhos apresentados na atividade — só depois que a organização publica
// a distribuição da edição. Autores só com nome (sem e-mail).
async function anexarTrabalhosApresentados(atividade, edicao) {
  if (!edicao?.apresentacaoPublicadaEm) return { ...atividade, trabalhos: [] };
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
  return { ...atividade, trabalhos };
}

const buscarAtividadePorEdicaoSlug = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarPorSlug(req.params.edicaoSlug);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");

  const atividade = await atividadesService.buscarPorSlug(edicao.id, req.params.atividadeSlug);
  if (!atividade) throw new ErroHttp(404, "Atividade não encontrada.");
  return res.json({ atividade: await anexarTrabalhosApresentados(atividade, edicao) });
});

const listarAtividades = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");

  const atividades = await atividadesService.listarAtividades(edicao.id);
  atividades.sort((a, b) => a.nome.localeCompare(b.nome));
  return res.json({ atividades });
});

const buscarAtividadePorSlug = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");

  const atividade = await atividadesService.buscarPorSlug(edicao.id, req.params.slug);
  if (!atividade) throw new ErroHttp(404, "Atividade não encontrada.");
  return res.json({ atividade: await anexarTrabalhosApresentados(atividade, edicao) });
});

const listarModalidadesSubmissao = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");

  const modalidades = await modalidadesSubmissaoService.listarModalidades(edicao.id);
  return res.json({ modalidades });
});

const buscarModalidadeSubmissaoPorSlug = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");

  const modalidade = await modalidadesSubmissaoService.buscarPorSlug(edicao.id, req.params.slug);
  if (!modalidade) throw new ErroHttp(404, "Modalidade de submissão não encontrada.");
  return res.json({ modalidade });
});

const listarGruposConteudo = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");

  const grupos = await gruposConteudoService.listarGrupos(edicao.id);
  return res.json({ grupos });
});

// Só depois da divulgação e só trabalhos com algum autor credenciado no
// evento (critério em utils/criterioAnais.js). Autores só com nome (sem e-mail).
const listarTrabalhosAprovados = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");
  if (!edicao.resultadoDivulgadoEm) return res.json({ trabalhos: [] });

  const trabalhos = await prisma.submissao.findMany({
    where: filtroTrabalhosAprovadosPublicos(edicao.id),
    select: {
      id: true,
      titulo: true,
      resumo: true,
      referenciaBibliografica: true,
      modalidadeSubmissao: { select: { id: true, nome: true, slug: true, ordem: true } },
      areaSubmissao: { select: { id: true, titulo: true, ordem: true } },
      autores: { select: { nome: true, principal: true }, orderBy: { ordem: "asc" } },
    },
    orderBy: { titulo: "asc" },
  });
  return res.json({ trabalhos });
});

const validarCertificado = asyncHandler(async (req, res) => {
  const certificado = await certificadosService.validar(req.params.codigo);
  return res.json({ certificado });
});

module.exports = {
  validarCertificado,
  listarTrabalhosAprovados,
  buscarEdicaoAtual,
  listarEdicoesAnteriores,
  buscarEdicaoPorSlug,
  listarAtividadesPorEdicaoSlug,
  buscarAtividadePorEdicaoSlug,
  listarAtividades,
  buscarAtividadePorSlug,
  listarModalidadesSubmissao,
  buscarModalidadeSubmissaoPorSlug,
  listarGruposConteudo,
};
