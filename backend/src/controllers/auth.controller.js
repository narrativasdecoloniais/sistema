const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const {
  cadastroSchema,
  loginSchema,
  recuperarSenhaSchema,
  redefinirSenhaSchema,
} = require("../validators/auth.validators");
const usuariosService = require("../services/usuarios.service");
const tokenService = require("../services/token.service");
const emailService = require("../services/email.service");
const authService = require("../services/auth.service");
const { conferirHash } = require("../utils/senha");

const cadastrar = asyncHandler(async (req, res) => {
  const dados = cadastroSchema.parse(req.body);

  const emailExistente = await usuariosService.buscarPorEmail(dados.email);
  if (emailExistente) {
    throw new ErroHttp(409, "Já existe um cadastro com esse e-mail.");
  }

  const cpfExistente = await usuariosService.buscarPorCpf(dados.cpf);
  if (cpfExistente) {
    throw new ErroHttp(409, "Já existe um cadastro com esse CPF.");
  }

  const usuario = await usuariosService.criarUsuario(dados);
  const token = await tokenService.criarTokenConfirmacaoEmail(usuario.id);
  await emailService.enviarEmailConfirmacao(usuario, token);

  return res.status(201).json({
    mensagem: "Cadastro realizado. Verifique seu e-mail para confirmar a conta.",
  });
});

const confirmarEmail = asyncHandler(async (req, res) => {
  const token = String(req.query.token || "");
  const registro = await tokenService.buscarTokenConfirmacaoEmailValido(token);

  if (!registro) {
    throw new ErroHttp(400, "Link de confirmação inválido ou expirado.");
  }

  await usuariosService.confirmarEmail(registro.usuarioId);
  return res.json({ mensagem: "E-mail confirmado com sucesso. Você já pode fazer login." });
});

const reenviarConfirmacao = asyncHandler(async (req, res) => {
  const dados = recuperarSenhaSchema.parse(req.body);
  const usuario = await usuariosService.buscarPorEmail(dados.email);

  if (usuario && !usuario.emailConfirmado) {
    const token = await tokenService.criarTokenConfirmacaoEmail(usuario.id);
    await emailService.enviarEmailConfirmacao(usuario, token);
  }

  return res.json({
    mensagem: "Se o e-mail estiver cadastrado e pendente de confirmação, reenviamos o link.",
  });
});

const login = asyncHandler(async (req, res) => {
  const dados = loginSchema.parse(req.body);
  const usuario = await usuariosService.buscarPorCpf(dados.cpf);

  const mensagemInvalida = "CPF ou senha inválidos.";
  if (!usuario || !usuario.ativo) {
    throw new ErroHttp(401, mensagemInvalida);
  }

  const senhaConfere = await conferirHash(dados.senha, usuario.senhaHash);
  if (!senhaConfere) {
    throw new ErroHttp(401, mensagemInvalida);
  }

  if (!usuario.emailConfirmado) {
    throw new ErroHttp(403, "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada ou peça um novo link.");
  }

  const sessao = await authService.criarSessao(usuario);
  authService.definirCookiesSessao(res, sessao);

  return res.json({
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papeis: usuario.papeis,
    },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const tokenAtual = req.cookies?.[authService.NOME_COOKIE_REFRESH];
  if (!tokenAtual) {
    throw new ErroHttp(401, "Sessão não encontrada. Faça login novamente.");
  }

  const novaSessao = await authService.rotacionarSessao(tokenAtual);
  if (!novaSessao) {
    authService.limparCookiesSessao(res);
    throw new ErroHttp(401, "Sessão expirada. Faça login novamente.");
  }

  authService.definirCookiesSessao(res, novaSessao);
  return res.json({ mensagem: "Sessão renovada." });
});

const logout = asyncHandler(async (req, res) => {
  const tokenAtual = req.cookies?.[authService.NOME_COOKIE_REFRESH];
  if (tokenAtual) {
    await authService.revogarRefreshToken(tokenAtual);
  }
  authService.limparCookiesSessao(res);
  return res.json({ mensagem: "Sessão encerrada." });
});

const recuperarSenha = asyncHandler(async (req, res) => {
  const dados = recuperarSenhaSchema.parse(req.body);
  const usuario = await usuariosService.buscarPorEmail(dados.email);

  if (usuario && usuario.ativo) {
    const token = await tokenService.criarTokenRecuperacaoSenha(usuario.id);
    await emailService.enviarEmailRecuperacaoSenha(usuario, token);
  }

  return res.json({
    mensagem: "Se o e-mail estiver cadastrado, enviamos instruções para redefinir a senha.",
  });
});

const redefinirSenha = asyncHandler(async (req, res) => {
  const dados = redefinirSenhaSchema.parse(req.body);
  const registro = await tokenService.consumirToken(dados.token, "RECUPERACAO_SENHA");

  if (!registro) {
    throw new ErroHttp(400, "Link de recuperação inválido ou expirado.");
  }

  await usuariosService.atualizarSenha(registro.usuarioId, dados.senha);
  return res.json({ mensagem: "Senha redefinida com sucesso. Você já pode fazer login." });
});

module.exports = {
  cadastrar,
  confirmarEmail,
  reenviarConfirmacao,
  login,
  refresh,
  logout,
  recuperarSenha,
  redefinirSenha,
};
