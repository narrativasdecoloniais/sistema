const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const usuariosService = require("./usuarios.service");
const tokenService = require("./token.service");
const emailService = require("./email.service");

const CAMPOS_ORGANIZADOR = {
  id: true,
  nome: true,
  email: true,
  cpf: true,
  documentoEstrangeiro: true,
  pais: true,
  papeis: true,
  acessoCompleto: true,
  secoesPermitidas: true,
};

async function listarOrganizadores() {
  return prisma.usuario.findMany({
    where: { papeis: { hasSome: ["ORGANIZADOR", "ADMIN"] } },
    select: CAMPOS_ORGANIZADOR,
    orderBy: { nome: "asc" },
  });
}

async function adicionarOrganizador(dados) {
  const usuario = await usuariosService.buscarPorEmail(dados.email);

  if (usuario) {
    if (usuario.papeis.includes("ORGANIZADOR")) {
      throw new ErroHttp(409, "Este usuário já é organizador.");
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        papeis: { push: "ORGANIZADOR" },
        acessoCompleto: dados.acessoCompleto,
        secoesPermitidas: dados.secoesPermitidas,
      },
    });
    await emailService.enviarEmailNotificacaoOrganizador(usuario);

    return prisma.usuario.findUnique({ where: { id: usuario.id }, select: CAMPOS_ORGANIZADOR });
  }

  const usuarioNovo = await usuariosService.criarUsuarioConvidado({
    nome: dados.nome,
    email: dados.email,
    acessoCompleto: dados.acessoCompleto,
    secoesPermitidas: dados.secoesPermitidas,
  });

  const token = await tokenService.criarTokenConviteOrganizador(usuarioNovo.id);
  await emailService.enviarEmailConviteOrganizador(usuarioNovo, token);

  return prisma.usuario.findUnique({ where: { id: usuarioNovo.id }, select: CAMPOS_ORGANIZADOR });
}

async function removerOrganizador(id) {
  const usuario = await usuariosService.buscarCompletoPorId(id);
  if (!usuario || !usuario.papeis.includes("ORGANIZADOR")) {
    throw new ErroHttp(404, "Organizador não encontrado.");
  }

  await prisma.usuario.update({
    where: { id },
    data: { papeis: usuario.papeis.filter((papel) => papel !== "ORGANIZADOR") },
  });
}

async function promoverAdmin(id) {
  const usuario = await usuariosService.buscarCompletoPorId(id);
  if (!usuario) throw new ErroHttp(404, "Organizador não encontrado.");
  if (usuario.papeis.includes("ADMIN")) {
    throw new ErroHttp(409, "Este usuário já é administrador.");
  }

  await prisma.usuario.update({
    where: { id },
    data: { papeis: { push: "ADMIN" } },
  });
  await emailService.enviarEmailPromocaoAdmin(usuario);

  return prisma.usuario.findUnique({ where: { id }, select: CAMPOS_ORGANIZADOR });
}

// Tira o ADMIN e deixa a pessoa como ORGANIZADOR, com as permissões por seção
// que já estavam gravadas (quem foi promovido direto da aba "Usuários" fica sem
// nenhuma seção até o admin editar). Nunca a si mesmo nem o último admin, pra
// ninguém perder o acesso à gestão da equipe.
async function rebaixarAdmin(id, idSolicitante) {
  if (id === idSolicitante) {
    throw new ErroHttp(409, "Você não pode remover seu próprio acesso de administrador.");
  }

  const usuario = await usuariosService.buscarCompletoPorId(id);
  if (!usuario || !usuario.papeis.includes("ADMIN")) {
    throw new ErroHttp(404, "Administrador não encontrado.");
  }

  const totalAdmins = await prisma.usuario.count({ where: { papeis: { has: "ADMIN" } } });
  if (totalAdmins <= 1) {
    throw new ErroHttp(409, "É preciso manter pelo menos um administrador.");
  }

  const papeis = usuario.papeis.filter((papel) => papel !== "ADMIN");
  if (!papeis.includes("ORGANIZADOR")) papeis.push("ORGANIZADOR");

  return prisma.usuario.update({
    where: { id },
    data: { papeis },
    select: CAMPOS_ORGANIZADOR,
  });
}

async function atualizarPermissoes(id, { acessoCompleto, secoesPermitidas }) {
  const usuario = await usuariosService.buscarCompletoPorId(id);
  if (!usuario || !usuario.papeis.includes("ORGANIZADOR")) {
    throw new ErroHttp(404, "Organizador não encontrado.");
  }
  if (usuario.papeis.includes("ADMIN")) {
    throw new ErroHttp(409, "Administradores já têm acesso total; não é possível restringir por seção.");
  }

  return prisma.usuario.update({
    where: { id },
    data: { acessoCompleto, secoesPermitidas },
    select: CAMPOS_ORGANIZADOR,
  });
}

module.exports = {
  listarOrganizadores,
  adicionarOrganizador,
  removerOrganizador,
  promoverAdmin,
  rebaixarAdmin,
  atualizarPermissoes,
};
