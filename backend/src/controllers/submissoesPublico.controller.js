const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const {
  emailSubmissaoSchema,
  cadastroSubmissaoSchema,
  entrarSubmissaoSchema,
  verificarEmailAutorSchema,
  criarSubmissaoSchema,
} = require("../validators/submissoes.validators");
const usuariosService = require("../services/usuarios.service");
const edicoesService = require("../services/edicoes.service");
const submissoesService = require("../services/submissoes.service");
const tokenService = require("../services/token.service");
const emailService = require("../services/email.service");

const tokenPorSessao = asyncHandler(async (req, res) => {
  const usuario = await usuariosService.buscarPorId(req.usuario.id);
  if (!usuario) throw new ErroHttp(404, "Usuário não encontrado.");

  const token = submissoesService.gerarTokenSubmissao(usuario.id);
  return res.json({ token, nome: usuario.nome });
});

const enviarLinkEntrada = asyncHandler(async (req, res) => {
  const dados = emailSubmissaoSchema.parse(req.body);
  const usuario = await usuariosService.buscarPorEmail(dados.email);

  if (!usuario || !usuario.ativo) {
    return res.json({ existe: false });
  }

  const token = await tokenService.criarTokenEntrarSubmissao(usuario.id);
  await emailService.enviarEmailEntrarSubmissao(usuario, token, dados.destino);
  return res.json({ existe: true });
});

const cadastrar = asyncHandler(async (req, res) => {
  const dados = cadastroSubmissaoSchema.parse(req.body);

  const emailExistente = await usuariosService.buscarPorEmail(dados.email);
  if (emailExistente) {
    throw new ErroHttp(409, "Já existe um cadastro com esse e-mail.");
  }

  const usuario = await usuariosService.criarUsuarioViaSubmissao(dados);
  const token = await tokenService.criarTokenEntrarSubmissao(usuario.id);
  await emailService.enviarEmailEntrarSubmissao(usuario, token, dados.destino);

  return res.status(201).json({ mensagem: "Verifique seu e-mail para continuar a submissão." });
});

const entrar = asyncHandler(async (req, res) => {
  const dados = entrarSubmissaoSchema.parse(req.body);
  const registro = await tokenService.consumirToken(dados.token, "ENTRAR_SUBMISSAO");
  if (!registro) {
    throw new ErroHttp(400, "Link de acesso inválido ou expirado.");
  }

  const usuario = await usuariosService.buscarCompletoPorId(registro.usuarioId);
  if (!usuario || !usuario.ativo) throw new ErroHttp(404, "Usuário não encontrado.");

  if (!usuario.emailConfirmado) {
    await usuariosService.confirmarEmail(usuario.id);
  }

  const token = submissoesService.gerarTokenSubmissao(usuario.id);
  return res.json({ token, nome: usuario.nome, email: usuario.email });
});

const verificarEmailAutor = asyncHandler(async (req, res) => {
  const dados = verificarEmailAutorSchema.parse(req.body);
  const nome = await usuariosService.buscarNomePublicoPorEmail(dados.email);
  return res.json({ nome });
});

const criar = asyncHandler(async (req, res) => {
  const dados = criarSubmissaoSchema.parse(req.body);
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");

  const submissao = await submissoesService.criarSubmissao(req.usuarioSubmissaoId, edicao.id, dados);
  return res.status(201).json({ submissao });
});

module.exports = {
  tokenPorSessao,
  enviarLinkEntrada,
  cadastrar,
  entrar,
  verificarEmailAutor,
  criar,
};
