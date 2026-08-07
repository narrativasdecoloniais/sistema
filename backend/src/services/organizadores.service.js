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
  papeis: true,
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
      data: { papeis: { push: "ORGANIZADOR" } },
    });
    await emailService.enviarEmailNotificacaoOrganizador(usuario);

    return prisma.usuario.findUnique({ where: { id: usuario.id }, select: CAMPOS_ORGANIZADOR });
  }

  const usuarioNovo = await usuariosService.criarUsuarioConvidado({
    nome: dados.nome,
    email: dados.email,
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

module.exports = {
  listarOrganizadores,
  adicionarOrganizador,
  removerOrganizador,
  promoverAdmin,
};
