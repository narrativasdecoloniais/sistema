const prisma = require("../config/prisma");
const { gerarHash } = require("../utils/senha");

const CAMPOS_PUBLICOS = {
  id: true,
  nome: true,
  email: true,
  cpf: true,
  instituicao: true,
  categoria: true,
  emailConfirmado: true,
  papeis: true,
  createdAt: true,
};

async function buscarPorCpf(cpf) {
  return prisma.usuario.findUnique({ where: { cpf } });
}

async function buscarPorEmail(email) {
  return prisma.usuario.findUnique({ where: { email } });
}

async function buscarPorId(id) {
  return prisma.usuario.findUnique({ where: { id }, select: CAMPOS_PUBLICOS });
}

async function buscarCompletoPorId(id) {
  return prisma.usuario.findUnique({ where: { id } });
}

async function criarUsuario(dados) {
  const senhaHash = await gerarHash(dados.senha);
  const agora = new Date();

  return prisma.usuario.create({
    data: {
      nome: dados.nome,
      email: dados.email,
      cpf: dados.cpf,
      instituicao: dados.instituicao,
      categoria: dados.categoria,
      senhaHash,
      aceiteTermosEm: agora,
      aceitePrivacidadeEm: agora,
    },
  });
}

async function atualizarPerfil(id, dados) {
  return prisma.usuario.update({
    where: { id },
    data: dados,
    select: CAMPOS_PUBLICOS,
  });
}

async function atualizarSenha(id, novaSenha) {
  const senhaHash = await gerarHash(novaSenha);
  await prisma.usuario.update({ where: { id }, data: { senhaHash } });
}

async function confirmarEmail(id) {
  await prisma.usuario.update({ where: { id }, data: { emailConfirmado: true } });
}

async function anonimizarUsuario(id) {
  await prisma.$transaction([
    prisma.usuario.update({
      where: { id },
      data: {
        nome: "Usuário removido",
        email: `anon-${id}@anonimizado.local`,
        cpf: `anon-${id}`,
        instituicao: "",
        papeis: [],
        ativo: false,
        anonimizadoEm: new Date(),
      },
    }),
    prisma.refreshToken.updateMany({
      where: { usuarioId: id, revogadoEm: null },
      data: { revogadoEm: new Date() },
    }),
  ]);
}

module.exports = {
  CAMPOS_PUBLICOS,
  buscarPorCpf,
  buscarPorEmail,
  buscarPorId,
  buscarCompletoPorId,
  criarUsuario,
  atualizarPerfil,
  atualizarSenha,
  confirmarEmail,
  anonimizarUsuario,
};
