const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const INCLUDE_PADRAO = require("../utils/submissaoIncludePadrao");
const sanitizarResumoSubmissao = require("../utils/sanitizarResumoSubmissao");
const sanitizarReferenciaBibliografica = require("../utils/sanitizarReferenciaBibliografica");
const processarImagensEmbutidas = require("../utils/processarImagensEmbutidas");
const { DATA_URI_IMAGEM } = require("../utils/sanitizadorRichText");
const storageService = require("./storage.service");
const { distribuirSubmissao } = require("./avaliacoes.service");

// Autosave do editor salva a cada poucos segundos — guarda uma cópia do
// texto anterior no máximo uma vez por janela, não uma por salvamento.
const JANELA_VERSAO_ORGANIZACAO_MS = 30 * 60 * 1000;
const TAMANHO_MAX_IMAGEM = 7_000_000; // ~5 MB de arquivo em base64

async function listarPorEdicao(edicaoId, { modalidadeSubmissaoId, areaSubmissaoId } = {}) {
  return prisma.submissao.findMany({
    where: {
      edicaoId,
      ...(modalidadeSubmissaoId ? { modalidadeSubmissaoId } : {}),
      ...(areaSubmissaoId ? { areaSubmissaoId } : {}),
    },
    include: INCLUDE_PADRAO,
    orderBy: { createdAt: "desc" },
  });
}

async function buscarPorId(id) {
  return prisma.submissao.findUnique({ where: { id }, include: INCLUDE_PADRAO });
}

async function excluir(id) {
  await prisma.submissao.delete({ where: { id } });
}

// Correção de enquadramento pela organização, só dentro da mesma modalidade.
// Sem decisão final, vale o mesmo que uma troca sugerida aprovada: as
// atribuições da área antiga caem e o trabalho é redistribuído. Com decisão
// final, a avaliação já acabou — só a área muda, o histórico fica.
async function alterarArea(edicaoId, id, areaSubmissaoId, usuarioId) {
  return prisma.$transaction(async (tx) => {
    const submissao = await tx.submissao.findUnique({
      where: { id },
      select: { edicaoId: true, modalidadeSubmissaoId: true, areaSubmissaoId: true, decisaoFinal: true },
    });
    if (!submissao || submissao.edicaoId !== edicaoId) throw new ErroHttp(404, "Submissão não encontrada.");

    const area = await tx.areaSubmissao.findUnique({
      where: { id: areaSubmissaoId },
      select: { modalidadeSubmissaoId: true },
    });
    if (!area || area.modalidadeSubmissaoId !== submissao.modalidadeSubmissaoId) {
      throw new ErroHttp(400, "Selecione uma área da mesma modalidade do trabalho.");
    }

    if (submissao.areaSubmissaoId !== areaSubmissaoId) {
      await tx.submissao.update({ where: { id }, data: { areaSubmissaoId } });

      // Sugestões pendentes perdem o sentido: a que apontava pra nova área
      // conta como aprovada, as demais como recusadas.
      const resolucao = { resolvidoPorId: usuarioId, resolvidoEm: new Date() };
      await tx.sugestaoTrocaArea.updateMany({
        where: { submissaoId: id, status: "PENDENTE", areaSugeridaId: areaSubmissaoId },
        data: { status: "APROVADA", ...resolucao },
      });
      await tx.sugestaoTrocaArea.updateMany({
        where: { submissaoId: id, status: "PENDENTE" },
        data: { status: "RECUSADA", ...resolucao },
      });

      if (!submissao.decisaoFinal) {
        await tx.atribuicaoAvaliacao.deleteMany({ where: { submissaoId: id } });
        await distribuirSubmissao(tx, id);
      }
    }

    return tx.submissao.findUnique({ where: { id }, include: INCLUDE_PADRAO });
  });
}

async function buscarDaEdicao(edicaoId, id) {
  const submissao = await prisma.submissao.findUnique({
    where: { id },
    select: {
      id: true,
      edicaoId: true,
      titulo: true,
      resumo: true,
      referenciaBibliografica: true,
      updatedAt: true,
      decisaoFinal: true,
      statusCorrecao: true,
      modalidadeSubmissao: { select: { id: true, nome: true } },
      areaSubmissao: { select: { id: true, titulo: true } },
      edicao: { select: { nome: true, prazoCorrecaoSubmissao: true } },
    },
  });
  if (!submissao || submissao.edicaoId !== edicaoId) throw new ErroHttp(404, "Submissão não encontrada.");
  return submissao;
}

async function buscarParaEdicao(edicaoId, id) {
  return buscarDaEdicao(edicaoId, id);
}

// Concorrência otimista: versaoBase é o updatedAt que o editor carregou (ou
// recebeu no último salvamento). Se outra aba, outro gestor ou o autor
// corrigindo salvou no meio, o salvamento é recusado em vez de sobrescrever.
async function salvarConteudo(edicaoId, id, { titulo, resumo, referenciaBibliografica, versaoBase }, usuarioId) {
  const atual = await buscarDaEdicao(edicaoId, id);
  if (atual.updatedAt.getTime() !== new Date(versaoBase).getTime()) {
    throw new ErroHttp(409, "Este trabalho foi alterado em outra janela. Recarregue a página para continuar.");
  }

  const resumoSanitizado = await processarImagensEmbutidas(sanitizarResumoSubmissao(resumo), "submissoes-resumo");
  const referenciaSanitizada = sanitizarReferenciaBibliografica(referenciaBibliografica);

  return prisma.$transaction(async (tx) => {
    const versaoRecente = await tx.submissaoVersao.findFirst({
      where: {
        submissaoId: id,
        origem: "ORGANIZACAO",
        createdAt: { gte: new Date(Date.now() - JANELA_VERSAO_ORGANIZACAO_MS) },
      },
      select: { id: true },
    });
    if (!versaoRecente) {
      await tx.submissaoVersao.create({
        data: {
          submissaoId: id,
          titulo: atual.titulo,
          resumo: atual.resumo,
          referenciaBibliografica: atual.referenciaBibliografica,
          origem: "ORGANIZACAO",
          editadoPorId: usuarioId,
        },
      });
    }

    // updatedAt no filtro fecha a janela entre a checagem acima e a escrita
    // (dois salvamentos quase simultâneos) — o segundo cai no 409.
    const { count } = await tx.submissao.updateMany({
      where: { id, updatedAt: atual.updatedAt },
      data: { titulo, resumo: resumoSanitizado, referenciaBibliografica: referenciaSanitizada },
    });
    if (count === 0) {
      throw new ErroHttp(409, "Este trabalho foi alterado em outra janela. Recarregue a página para continuar.");
    }

    return tx.submissao.findUnique({
      where: { id },
      select: { updatedAt: true, titulo: true, resumo: true, referenciaBibliografica: true },
    });
  });
}

// Imagem inserida no editor da organização sobe na hora (o editor guarda só
// a URL) — assim o autosave nunca reenvia o mesmo data URI.
async function enviarImagem(edicaoId, id, dataUri) {
  await buscarDaEdicao(edicaoId, id);
  if (typeof dataUri !== "string" || !DATA_URI_IMAGEM.test(dataUri)) {
    throw new ErroHttp(400, "Envie uma imagem PNG, JPEG, GIF ou WebP.");
  }
  if (dataUri.length > TAMANHO_MAX_IMAGEM) throw new ErroHttp(400, "Imagem muito grande (máximo de 5 MB).");
  return storageService.salvarImagemPublica(dataUri, "submissoes-resumo");
}

module.exports = { listarPorEdicao, buscarPorId, excluir, alterarArea, buscarParaEdicao, salvarConteudo, enviarImagem };
