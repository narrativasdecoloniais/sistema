const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const storageService = require("./storage.service");
const anaisService = require("./anais.service");
const { montarDocumentoAnais, montarDocumentoArtigo } = require("./anaisDocumento.service");
const { gerarPdfAnais, gerarPdfArtigo: desenharPdfArtigo } = require("./pdfAnais.service");
const { gerarDocxAnais } = require("./docxAnais.service");
const { gerarSlug } = require("../utils/slug");

// Geração dos Anais completos (PDF/Word) em segundo plano: com muitos
// trabalhos e imagens leva de segundos a minutos, então a requisição volta
// na hora (202) e o admin acompanha pelo painel. Uma geração por edição
// (processo único no Railway, como o envio de e-mails do resultado); se o
// servidor reiniciar no meio, basta pedir de novo.

const TIPOS = {
  pdf: { contentType: "application/pdf", extensao: "pdf", campoUrl: "pdfUrl", campoData: "pdfGeradoEm" },
  docx: {
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensao: "docx",
    campoUrl: "docxUrl",
    campoData: "docxGeradoEm",
  },
};

const geracoesEmAndamento = new Map(); // edicaoId -> formato

function emAndamento(edicaoId) {
  return geracoesEmAndamento.get(edicaoId) || null;
}

async function gravarPaginas(paginas) {
  await prisma.$transaction(
    [...paginas.entries()].map(([id, pagina]) =>
      prisma.artigoAnais.update({ where: { id }, data: { paginaInicial: pagina.inicio, paginaFinal: pagina.fim } })
    )
  );
}

async function executar(edicaoId, formato) {
  const tipo = TIPOS[formato];
  try {
    const documento = await montarDocumentoAnais(edicaoId);
    let buffer;
    if (formato === "pdf") {
      const resultado = await gerarPdfAnais(documento);
      buffer = resultado.buffer;
      await gravarPaginas(resultado.paginas);
    } else {
      buffer = await gerarDocxAnais(documento);
    }

    const nomeBase = gerarSlug(`anais ${documento.edicao.slug || documento.edicao.numero}`) || "anais";
    const url = await storageService.salvarBufferPublico(buffer, tipo.contentType, tipo.extensao, "anais", {
      nomeDownload: `${nomeBase}.${tipo.extensao}`,
    });

    const anterior = await prisma.anaisEdicao.findUnique({ where: { edicaoId }, select: { [tipo.campoUrl]: true } });
    await prisma.anaisEdicao.update({
      where: { edicaoId },
      data: {
        [tipo.campoUrl]: url,
        [tipo.campoData]: new Date(),
        geracaoFormato: null,
        geracaoIniciadaEm: null,
        erroGeracao: null,
      },
    });
    // O arquivo antigo sai do bucket só depois que o novo já está no ar.
    if (anterior?.[tipo.campoUrl]) {
      await storageService.removerImagemPublica(anterior[tipo.campoUrl]).catch((erro) =>
        console.error("[anais] falha ao remover arquivo antigo:", erro.message)
      );
    }
    console.log(`[anais] ${formato} da edição ${edicaoId} gerado (${Math.round(buffer.length / 1024)} KB)`);
  } catch (erro) {
    console.error(`[anais] falha ao gerar ${formato} da edição ${edicaoId}:`, erro);
    await prisma.anaisEdicao
      .update({
        where: { edicaoId },
        data: {
          geracaoFormato: null,
          geracaoIniciadaEm: null,
          erroGeracao: erro instanceof ErroHttp ? erro.message : `Não foi possível gerar o arquivo (${erro.message}).`,
        },
      })
      .catch(() => {});
  } finally {
    geracoesEmAndamento.delete(edicaoId);
  }
}

async function iniciarGeracao(edicaoId, formato) {
  if (geracoesEmAndamento.has(edicaoId)) {
    throw new ErroHttp(409, "Já existe um arquivo dos Anais sendo gerado. Aguarde terminar.");
  }
  const edicao = await anaisService.buscarEdicao(edicaoId);
  if (!edicao.anais) throw new ErroHttp(409, "Salve as configurações dos Anais antes de gerar os arquivos.");

  geracoesEmAndamento.set(edicaoId, formato);
  try {
    await prisma.anaisEdicao.update({
      where: { edicaoId },
      data: { geracaoFormato: formato, geracaoIniciadaEm: new Date(), erroGeracao: null },
    });
  } catch (erro) {
    geracoesEmAndamento.delete(edicaoId);
    throw erro;
  }
  // Sem await: a resposta sai já; o resultado fica no registro dos Anais.
  executar(edicaoId, formato);
}

// PDF individual (página pública do trabalho), gerado na hora.
async function gerarPdfArtigo(edicaoSlug, artigoSlug) {
  const documento = await montarDocumentoArtigo(edicaoSlug, artigoSlug);
  const buffer = await desenharPdfArtigo(documento);
  return { buffer, artigoId: documento.artigo.id };
}

module.exports = { emAndamento, iniciarGeracao, gerarPdfArtigo };
