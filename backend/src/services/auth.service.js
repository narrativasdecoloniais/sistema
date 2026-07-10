const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const env = require("../config/env");

const NOME_COOKIE_ACESSO = "access_token";
const NOME_COOKIE_REFRESH = "refresh_token";

function hashToken(tokenBruto) {
  return crypto.createHash("sha256").update(tokenBruto).digest("hex");
}

function parseDuracaoParaMs(duracao) {
  const correspondencia = /^(\d+)(ms|s|m|h|d)$/.exec(duracao);
  if (!correspondencia) return 15 * 60 * 1000;

  const valor = Number(correspondencia[1]);
  const unidade = correspondencia[2];
  const multiplicadores = { ms: 1, s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return valor * multiplicadores[unidade];
}

function gerarAccessToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, papeis: usuario.papeis },
    env.jwtAccessSecret,
    { expiresIn: env.accessTokenExpiresIn }
  );
}

function verificarAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

async function criarRefreshToken(usuarioId) {
  const tokenBruto = crypto.randomBytes(40).toString("hex");
  const expiraEm = new Date(Date.now() + parseDuracaoParaMs(env.refreshTokenExpiresIn));

  await prisma.refreshToken.create({
    data: { usuarioId, tokenHash: hashToken(tokenBruto), expiraEm },
  });

  return tokenBruto;
}

async function criarSessao(usuario) {
  const accessToken = gerarAccessToken(usuario);
  const refreshToken = await criarRefreshToken(usuario.id);
  return { accessToken, refreshToken };
}

async function rotacionarSessao(tokenBrutoAntigo) {
  const registro = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(tokenBrutoAntigo) },
    include: { usuario: true },
  });

  if (!registro || registro.revogadoEm || registro.expiraEm < new Date()) {
    return null;
  }

  await prisma.refreshToken.update({
    where: { id: registro.id },
    data: { revogadoEm: new Date() },
  });

  if (!registro.usuario.ativo) return null;

  return criarSessao(registro.usuario);
}

async function revogarRefreshToken(tokenBruto) {
  await prisma.refreshToken
    .updateMany({
      where: { tokenHash: hashToken(tokenBruto), revogadoEm: null },
      data: { revogadoEm: new Date() },
    })
    .catch(() => {});
}

function definirCookiesSessao(res, { accessToken, refreshToken }) {
  const opcoesBase = {
    httpOnly: true,
    sameSite: "lax",
    secure: env.producao,
    path: "/",
    domain: env.cookieDomain,
  };

  res.cookie(NOME_COOKIE_ACESSO, accessToken, {
    ...opcoesBase,
    maxAge: parseDuracaoParaMs(env.accessTokenExpiresIn),
  });
  res.cookie(NOME_COOKIE_REFRESH, refreshToken, {
    ...opcoesBase,
    maxAge: parseDuracaoParaMs(env.refreshTokenExpiresIn),
  });
}

function limparCookiesSessao(res) {
  res.clearCookie(NOME_COOKIE_ACESSO, { path: "/", domain: env.cookieDomain });
  res.clearCookie(NOME_COOKIE_REFRESH, { path: "/", domain: env.cookieDomain });
}

module.exports = {
  NOME_COOKIE_ACESSO,
  NOME_COOKIE_REFRESH,
  gerarAccessToken,
  verificarAccessToken,
  criarSessao,
  rotacionarSessao,
  revogarRefreshToken,
  definirCookiesSessao,
  limparCookiesSessao,
};
