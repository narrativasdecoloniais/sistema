const crypto = require("crypto");
const prisma = require("../config/prisma");

const VALIDADE_CONFIRMACAO_EMAIL_HORAS = 48;
const VALIDADE_RECUPERACAO_SENHA_HORAS = 2;

function gerarTokenAleatorio() {
  return crypto.randomBytes(32).toString("hex");
}

async function criarTokenConfirmacaoEmail(usuarioId) {
  const token = gerarTokenAleatorio();
  const expiraEm = new Date(Date.now() + VALIDADE_CONFIRMACAO_EMAIL_HORAS * 60 * 60 * 1000);

  await prisma.tokenVerificacao.create({
    data: { usuarioId, tipo: "CONFIRMACAO_EMAIL", token, expiraEm },
  });

  return token;
}

async function criarTokenRecuperacaoSenha(usuarioId) {
  const token = gerarTokenAleatorio();
  const expiraEm = new Date(Date.now() + VALIDADE_RECUPERACAO_SENHA_HORAS * 60 * 60 * 1000);

  await prisma.tokenVerificacao.create({
    data: { usuarioId, tipo: "RECUPERACAO_SENHA", token, expiraEm },
  });

  return token;
}

async function consumirToken(token, tipo) {
  const registro = await prisma.tokenVerificacao.findUnique({ where: { token } });

  if (!registro || registro.tipo !== tipo) return null;
  if (registro.usadoEm) return null;
  if (registro.expiraEm < new Date()) return null;

  await prisma.tokenVerificacao.update({
    where: { id: registro.id },
    data: { usadoEm: new Date() },
  });

  return registro;
}

module.exports = {
  criarTokenConfirmacaoEmail,
  criarTokenRecuperacaoSenha,
  consumirToken,
};
