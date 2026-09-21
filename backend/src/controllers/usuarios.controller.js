const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const {
  atualizarPerfilSchema,
  alterarSenhaSchema,
  atualizarEmailSchema,
  previaUnificacaoSchema,
  unificarUsuariosSchema,
} = require("../validators/usuarios.validators");
const usuariosService = require("../services/usuarios.service");
const unificacaoService = require("../services/unificacaoUsuarios.service");
const authService = require("../services/auth.service");
const { conferirHash } = require("../utils/senha");

const meuPerfil = asyncHandler(async (req, res) => {
  const usuario = await usuariosService.buscarPorId(req.usuario.id);
  if (!usuario) throw new ErroHttp(404, "Usuário não encontrado.");
  return res.json({ usuario });
});

const buscar = asyncHandler(async (req, res) => {
  const termo = String(req.query.termo || "").trim();
  if (termo.length < 2) return res.json({ usuarios: [] });

  const usuarios = await usuariosService.buscarPorTermo(termo);
  return res.json({ usuarios });
});

const atualizarEmailUsuario = asyncHandler(async (req, res) => {
  const dados = atualizarEmailSchema.parse(req.body);
  const usuario = await usuariosService.atualizarEmail(req.params.id, dados.email);
  return res.json({ usuario });
});

const previaUnificacao = asyncHandler(async (req, res) => {
  const dados = previaUnificacaoSchema.parse(req.body);
  const previa = await unificacaoService.previaUnificacao(dados.manterId, dados.removerId);
  return res.json({ previa });
});

const unificarUsuarios = asyncHandler(async (req, res) => {
  const dados = unificarUsuariosSchema.parse(req.body);
  const resultado = await unificacaoService.unificarUsuarios(dados);
  console.log(
    `[unificacao] ${req.usuario.id} uniu a conta ${dados.removerId} na conta ${dados.manterId}`
  );
  return res.json(resultado);
});

const atualizarMeuPerfil = asyncHandler(async (req, res) => {
  const dados = atualizarPerfilSchema.parse(req.body);
  const usuario = await usuariosService.atualizarPerfil(req.usuario.id, dados);
  return res.json({ usuario });
});

const alterarMinhaSenha = asyncHandler(async (req, res) => {
  const dados = alterarSenhaSchema.parse(req.body);
  const usuario = await usuariosService.buscarCompletoPorId(req.usuario.id);

  const senhaConfere = await conferirHash(dados.senhaAtual, usuario.senhaHash);
  if (!senhaConfere) {
    throw new ErroHttp(401, "Senha atual incorreta.");
  }

  await usuariosService.atualizarSenha(req.usuario.id, dados.novaSenha);
  return res.json({ mensagem: "Senha alterada com sucesso." });
});

const excluirMinhaConta = asyncHandler(async (req, res) => {
  await usuariosService.anonimizarUsuario(req.usuario.id);
  authService.limparCookiesSessao(res);
  return res.json({ mensagem: "Conta excluída com sucesso." });
});

module.exports = {
  meuPerfil,
  buscar,
  atualizarEmailUsuario,
  previaUnificacao,
  unificarUsuarios,
  atualizarMeuPerfil,
  alterarMinhaSenha,
  excluirMinhaConta,
};
