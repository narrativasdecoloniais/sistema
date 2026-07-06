const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const { atualizarPerfilSchema, alterarSenhaSchema } = require("../validators/usuarios.validators");
const usuariosService = require("../services/usuarios.service");
const authService = require("../services/auth.service");
const { conferirHash } = require("../utils/senha");

const meuPerfil = asyncHandler(async (req, res) => {
  const usuario = await usuariosService.buscarPorId(req.usuario.id);
  if (!usuario) throw new ErroHttp(404, "Usuário não encontrado.");
  return res.json({ usuario });
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

module.exports = { meuPerfil, atualizarMeuPerfil, alterarMinhaSenha, excluirMinhaConta };
