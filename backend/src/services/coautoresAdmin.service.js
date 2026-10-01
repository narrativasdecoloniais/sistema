const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const usuariosService = require("./usuarios.service");
const convitesCoautorService = require("./convitesCoautor.service");

// Tela admin de Coautores (Submissões → Coautores): acompanha quem já se
// cadastrou, corrige nome/e-mail, liga a uma conta existente (quem se
// cadastrou com outro e-mail) e exclui coautor. Os convites em si ficam em
// convitesCoautor.service.js.

async function buscarAutoria(edicaoId, autorId) {
  const autoria = await prisma.submissaoAutor.findFirst({
    where: { id: autorId, principal: false, submissao: { edicaoId } },
  });
  if (!autoria) throw new ErroHttp(404, "Coautor não encontrado.");
  return autoria;
}

async function garantirNaoDuplicaNaSubmissao(autoria, { email, usuarioId }) {
  const outro = await prisma.submissaoAutor.findFirst({
    where: {
      submissaoId: autoria.submissaoId,
      id: { not: autoria.id },
      OR: [
        { email: { equals: email, mode: "insensitive" } },
        ...(usuarioId ? [{ usuarioId }] : []),
      ],
    },
  });
  if (outro) throw new ErroHttp(409, "Essa pessoa já é autora deste trabalho.");
}

async function listar(edicaoId) {
  const autorias = await prisma.submissaoAutor.findMany({
    where: { principal: false, submissao: { edicaoId } },
    select: {
      id: true,
      nome: true,
      email: true,
      usuarioId: true,
      usuario: { select: { id: true, nome: true, email: true } },
      submissao: {
        select: { id: true, titulo: true, autores: { where: { principal: true }, select: { nome: true } } },
      },
    },
    orderBy: [{ submissao: { titulo: "asc" } }, { ordem: "asc" }],
  });

  const convites = await convitesCoautorService.mapaConvites(
    autorias.filter((autoria) => !autoria.usuarioId).map((autoria) => autoria.email)
  );

  return autorias.map((autoria) => ({
    id: autoria.id,
    nome: autoria.nome,
    email: autoria.email,
    conta: autoria.usuario,
    submissao: { id: autoria.submissao.id, titulo: autoria.submissao.titulo },
    autorPrincipal: autoria.submissao.autores[0]?.nome || "",
    ...convitesCoautorService.situacaoAutoria(autoria, convites),
  }));
}

// E-mail novo recalcula o vínculo: liga à conta com esse e-mail, se houver,
// ou deixa solto e já manda o convite.
async function atualizar(edicaoId, autorId, { nome, email }) {
  const autoria = await buscarAutoria(edicaoId, autorId);
  const emailMudou = autoria.email.toLowerCase() !== email.toLowerCase();

  let usuarioId = autoria.usuarioId;
  let novoEmail = autoria.email;
  if (emailMudou) {
    const conta = await usuariosService.buscarPorEmail(email);
    if (conta && (!conta.ativo || conta.anonimizadoEm)) {
      throw new ErroHttp(409, "Este e-mail pertence a uma conta desativada.");
    }
    usuarioId = conta?.id || null;
    novoEmail = conta ? conta.email : usuariosService.normalizarEmail(email);
    await garantirNaoDuplicaNaSubmissao(autoria, { email: novoEmail, usuarioId });
  }

  await prisma.submissaoAutor.update({
    where: { id: autoria.id },
    data: { nome, email: novoEmail, usuarioId },
  });

  let conviteEnfileirado = false;
  if (emailMudou && !usuarioId) {
    const convites = await convitesCoautorService.garantirConvites([novoEmail]);
    conviteEnfileirado = convitesCoautorService.enfileirar(convites.map((convite) => convite.id)) > 0;
  }
  return { conviteEnfileirado };
}

// Liga a autoria a uma conta escolhida na busca — caso típico: a pessoa se
// cadastrou com outro e-mail. A autoria passa a usar o e-mail da conta (é
// para ele que saem os e-mails de resultado).
async function vincular(edicaoId, autorId, usuarioId) {
  const autoria = await buscarAutoria(edicaoId, autorId);
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario || !usuario.ativo || usuario.anonimizadoEm) throw new ErroHttp(404, "Usuário não encontrado.");

  await garantirNaoDuplicaNaSubmissao(autoria, { email: usuario.email, usuarioId });
  await prisma.submissaoAutor.update({
    where: { id: autoria.id },
    data: { usuarioId, email: usuario.email },
  });
}

// Certificado não revogado ligado à autoria bloqueia — o onDelete SetNull
// deixaria um certificado válido sem dono.
async function excluir(edicaoId, autorId) {
  const autoria = await buscarAutoria(edicaoId, autorId);
  const certificados = await prisma.certificado.count({
    where: { submissaoAutorId: autoria.id, revogadoEm: null },
  });
  if (certificados > 0) {
    throw new ErroHttp(409, "Este coautor tem certificado emitido. Revogue o certificado antes de excluir.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.submissaoAutor.delete({ where: { id: autoria.id } });
    const restantes = await tx.submissaoAutor.findMany({
      where: { submissaoId: autoria.submissaoId },
      orderBy: { ordem: "asc" },
      select: { id: true, ordem: true },
    });
    for (const [indice, autor] of restantes.entries()) {
      if (autor.ordem !== indice) await tx.submissaoAutor.update({ where: { id: autor.id }, data: { ordem: indice } });
    }
  });
}

module.exports = { listar, atualizar, vincular, excluir };
