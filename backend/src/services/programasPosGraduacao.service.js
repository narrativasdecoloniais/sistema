const prisma = require("../config/prisma");
const storageService = require("./storage.service");

async function listarProgramasPosGraduacao() {
  return prisma.programaPosGraduacao.findMany({ orderBy: { createdAt: "asc" } });
}

async function buscarPorId(id) {
  return prisma.programaPosGraduacao.findUnique({ where: { id } });
}

async function criarPrograma(dados) {
  const campos = { nome: dados.nome, link: dados.link || null };
  if (dados.imagem) {
    campos.imagem = await storageService.salvarImagemPublica(dados.imagem, "programas-pos-graduacao");
  }
  return prisma.programaPosGraduacao.create({ data: campos });
}

// imagem === undefined: mantém a atual; null: remove; data URI: substitui —
// mesmo contrato de processarImagemEscalar em edicoes.service.js.
async function atualizarPrograma(id, dados) {
  const campos = { nome: dados.nome, link: dados.link || null };

  if (dados.imagem === null) {
    const atual = await prisma.programaPosGraduacao.findUnique({ where: { id }, select: { imagem: true } });
    await storageService.removerImagemPublica(atual?.imagem);
    campos.imagem = null;
  } else if (typeof dados.imagem === "string" && dados.imagem.startsWith("data:image/")) {
    const atual = await prisma.programaPosGraduacao.findUnique({ where: { id }, select: { imagem: true } });
    campos.imagem = await storageService.salvarImagemPublica(dados.imagem, "programas-pos-graduacao");
    await storageService.removerImagemPublica(atual?.imagem);
  }

  return prisma.programaPosGraduacao.update({ where: { id }, data: campos });
}

async function excluirPrograma(id) {
  const programa = await prisma.programaPosGraduacao.findUnique({ where: { id } });
  if (!programa) return;
  await storageService.removerImagemPublica(programa.imagem);
  await prisma.programaPosGraduacao.delete({ where: { id } });
}

module.exports = {
  listarProgramasPosGraduacao,
  buscarPorId,
  criarPrograma,
  atualizarPrograma,
  excluirPrograma,
};
