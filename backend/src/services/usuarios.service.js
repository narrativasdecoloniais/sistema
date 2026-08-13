const crypto = require("crypto");
const prisma = require("../config/prisma");
const { gerarHash } = require("../utils/senha");
const storageService = require("./storage.service");

const CAMPOS_PUBLICOS = {
  id: true,
  nome: true,
  email: true,
  cpf: true,
  instituicao: true,
  categoria: true,
  foto: true,
  emailConfirmado: true,
  papeis: true,
  acessoCompleto: true,
  secoesPermitidas: true,
  createdAt: true,
};

// Usuario.foto guarda só o path do objeto no bucket privado do GCS — nunca a
// URL assinada, que expira em 1h e é gerada de novo a cada leitura.
async function anexarUrlFoto(usuario) {
  if (!usuario) return usuario;
  return { ...usuario, foto: await storageService.gerarUrlAssinada(usuario.foto) };
}

async function buscarPorCpf(cpf) {
  return prisma.usuario.findUnique({ where: { cpf } });
}

async function buscarPorEmail(email) {
  return prisma.usuario.findUnique({ where: { email } });
}

async function buscarPorId(id) {
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: CAMPOS_PUBLICOS });
  return anexarUrlFoto(usuario);
}

// Usado pelo admin para localizar um usuário já cadastrado (via cadastro
// público ou inscrição) ao adicionar uma inscrição manualmente — nunca cria
// conta nova por aqui.
async function buscarPorTermo(termo) {
  return prisma.usuario.findMany({
    where: {
      ativo: true,
      OR: [
        { nome: { contains: termo, mode: "insensitive" } },
        { email: { contains: termo, mode: "insensitive" } },
        { cpf: { contains: termo, mode: "insensitive" } },
      ],
    },
    select: { id: true, nome: true, email: true, cpf: true, instituicao: true, categoria: true },
    take: 10,
    orderBy: { nome: "asc" },
  });
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

// Cria uma conta sem senha, CPF, categoria ou instituição — usada quando um
// admin convida alguém para organizar antes dessa pessoa ter se cadastrado por
// conta própria. Senha e CPF reais só são definidos quando o convite é aceito
// (ver definirSenhaEAceites), então o hash abaixo nunca é utilizável para login.
async function criarUsuarioConvidado({ nome, email, acessoCompleto, secoesPermitidas }) {
  const senhaHash = await gerarHash(crypto.randomBytes(32).toString("hex"));

  return prisma.usuario.create({
    data: {
      nome,
      email,
      senhaHash,
      papeis: ["ORGANIZADOR"],
      acessoCompleto,
      secoesPermitidas,
    },
  });
}

// Cria uma conta sem senha utilizável, usada pelo fluxo público de
// auto-inscrição em eventos: a pessoa preenche os dados de cadastro sem
// definir senha (nem confirmar e-mail) e só define uma senha real depois,
// via "esqueci minha senha", se quiser fazer login.
async function criarUsuarioViaInscricao({ nome, email, cpf, instituicao, categoria }) {
  const senhaHash = await gerarHash(crypto.randomBytes(32).toString("hex"));
  const agora = new Date();

  return prisma.usuario.create({
    data: {
      nome,
      email,
      cpf,
      instituicao,
      categoria,
      senhaHash,
      aceiteTermosEm: agora,
      aceitePrivacidadeEm: agora,
    },
  });
}

async function definirSenhaEAceites(id, { senha, cpf, aceiteTermosEm, aceitePrivacidadeEm }) {
  const senhaHash = await gerarHash(senha);

  return prisma.usuario.update({
    where: { id },
    data: {
      senhaHash,
      cpf,
      emailConfirmado: true,
      aceiteTermosEm,
      aceitePrivacidadeEm,
    },
  });
}

async function atualizarPerfil(id, dados) {
  const camposParaSalvar = { ...dados };

  if ("foto" in dados) {
    const usuarioAtual = await buscarCompletoPorId(id);
    if (dados.foto && dados.foto.startsWith("data:image/")) {
      camposParaSalvar.foto = await storageService.salvarImagemPrivada(dados.foto, "usuarios");
    }
    if (usuarioAtual?.foto) {
      await storageService.removerImagemPrivada(usuarioAtual.foto);
    }
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data: camposParaSalvar,
    select: CAMPOS_PUBLICOS,
  });
  return anexarUrlFoto(usuario);
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
        acessoCompleto: false,
        secoesPermitidas: [],
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
  buscarPorTermo,
  buscarCompletoPorId,
  criarUsuario,
  criarUsuarioConvidado,
  criarUsuarioViaInscricao,
  definirSenhaEAceites,
  atualizarPerfil,
  atualizarSenha,
  confirmarEmail,
  anonimizarUsuario,
};
