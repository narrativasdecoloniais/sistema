const crypto = require("crypto");
const prisma = require("../config/prisma");

const VALIDADE_CONFIRMACAO_EMAIL_HORAS = 48;
const VALIDADE_RECUPERACAO_SENHA_HORAS = 2;
const VALIDADE_CONVITE_ORGANIZADOR_HORAS = 24 * 7;
const VALIDADE_ENTRAR_SUBMISSAO_MINUTOS = 30;
const VALIDADE_VINCULAR_CONTA_MINUTOS = 30;

// Sem 0/O/1/I/L — o código é digitado à mão a partir do e-mail.
const ALFABETO_CODIGO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const TAMANHO_CODIGO = 8;

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

async function criarTokenConviteOrganizador(usuarioId) {
  const token = gerarTokenAleatorio();
  const expiraEm = new Date(Date.now() + VALIDADE_CONVITE_ORGANIZADOR_HORAS * 60 * 60 * 1000);

  await prisma.tokenVerificacao.create({
    data: { usuarioId, tipo: "CONVITE_ORGANIZADOR", token, expiraEm },
  });

  return token;
}

// Link mágico do fluxo passwordless de submissão de trabalho — identifica só
// por e-mail (sem CPF). Validade curta porque é só a etapa de identificação;
// a sessão de submissão em si (JWT bearer) tem validade própria e maior, ver
// submissoes.service.js.
async function criarTokenEntrarSubmissao(usuarioId) {
  const token = gerarTokenAleatorio();
  const expiraEm = new Date(Date.now() + VALIDADE_ENTRAR_SUBMISSAO_MINUTOS * 60 * 1000);

  await prisma.tokenVerificacao.create({
    data: { usuarioId, tipo: "ENTRAR_SUBMISSAO", token, expiraEm },
  });

  return token;
}

function normalizarCodigoVinculo(codigo) {
  return String(codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// O token guardado leva o id do usuário como prefixo: como o código é curto
// (feito pra digitar), a busca precisa ser sempre por (conta + código) e
// nunca só pelo código — senão um chute qualquer poderia bater no código
// pendente de outra pessoa. Só vale uma vez por conta: pedir de novo
// invalida o anterior.
function chaveCodigoVinculo(usuarioId, codigo) {
  return `vinculo.${usuarioId}.${normalizarCodigoVinculo(codigo)}`;
}

async function criarCodigoVinculoConta(usuarioId) {
  const codigo = Array.from(
    { length: TAMANHO_CODIGO },
    () => ALFABETO_CODIGO[crypto.randomInt(ALFABETO_CODIGO.length)]
  ).join("");
  const expiraEm = new Date(Date.now() + VALIDADE_VINCULAR_CONTA_MINUTOS * 60 * 1000);

  await prisma.$transaction([
    prisma.tokenVerificacao.deleteMany({
      where: { usuarioId, tipo: "VINCULAR_CONTA", usadoEm: null },
    }),
    prisma.tokenVerificacao.create({
      data: { usuarioId, tipo: "VINCULAR_CONTA", token: chaveCodigoVinculo(usuarioId, codigo), expiraEm },
    }),
  ]);

  return codigo;
}

async function consumirCodigoVinculoConta(usuarioId, codigo) {
  return consumirToken(chaveCodigoVinculo(usuarioId, codigo), "VINCULAR_CONTA");
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

// A confirmação de e-mail só marca um booleano idempotente, então o token pode
// ser revisitado sem erro (o clique real do usuário costuma vir acompanhado de
// pré-visitas de scanners de e-mail corporativos, além do double-effect do
// React StrictMode em dev) — diferente da recuperação de senha, que continua
// de uso único por ser uma ação sensível.
async function buscarTokenConfirmacaoEmailValido(token) {
  const registro = await prisma.tokenVerificacao.findUnique({ where: { token } });

  if (!registro || registro.tipo !== "CONFIRMACAO_EMAIL") return null;
  if (registro.expiraEm < new Date()) return null;

  if (!registro.usadoEm) {
    await prisma.tokenVerificacao.update({
      where: { id: registro.id },
      data: { usadoEm: new Date() },
    });
  }

  return registro;
}

module.exports = {
  criarTokenConfirmacaoEmail,
  criarTokenRecuperacaoSenha,
  criarTokenConviteOrganizador,
  criarTokenEntrarSubmissao,
  criarCodigoVinculoConta,
  consumirCodigoVinculoConta,
  consumirToken,
  buscarTokenConfirmacaoEmailValido,
};
