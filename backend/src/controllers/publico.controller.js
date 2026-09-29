const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const edicoesService = require("../services/edicoes.service");
const atividadesService = require("../services/atividades.service");
const modalidadesSubmissaoService = require("../services/modalidadesSubmissao.service");
const gruposConteudoService = require("../services/gruposConteudo.service");
const prisma = require("../config/prisma");

const buscarEdicaoAtual = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");
  return res.json({ edicao });
});

const listarEdicoesAnteriores = asyncHandler(async (req, res) => {
  const atual = await edicoesService.buscarEdicaoAtual();
  const edicoes = atual ? await edicoesService.listarEdicoesAnteriores(atual.numero) : [];
  return res.json({ edicoes });
});

const buscarEdicaoPorSlug = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarPorSlug(req.params.slug);
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
  return res.json({ edicao });
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

// Só depois da divulgação. Ressalvas/formatação entram quando a correção
// estiver concluída — nunca publica texto ainda pendente de ajuste. Autores
// só com nome (sem e-mail).
const listarTrabalhosAprovados = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");
  if (!edicao.resultadoDivulgadoEm) return res.json({ trabalhos: [] });

  const trabalhos = await prisma.submissao.findMany({
    where: {
      edicaoId: edicao.id,
      OR: [
        { decisaoFinal: "APROVADO" },
        { decisaoFinal: { in: ["APROVADO_COM_RESSALVAS", "APROVADO_FORMATACAO"] }, statusCorrecao: "CONCLUIDA" },
      ],
    },
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

module.exports = {
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
