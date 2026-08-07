const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const {
  cpfLookupSchema,
  confirmarEmailExistenteSchema,
  cadastroInscricaoSchema,
  selecionarAtividadesSchema,
} = require("../validators/inscricoes.validators");
const usuariosService = require("../services/usuarios.service");
const edicoesService = require("../services/edicoes.service");
const inscricoesService = require("../services/inscricoes.service");
const emailService = require("../services/email.service");

const buscarPorCpf = asyncHandler(async (req, res) => {
  const dados = cpfLookupSchema.parse(req.body);
  const usuario = await usuariosService.buscarPorCpf(dados.cpf);
  return res.json({ existe: Boolean(usuario && usuario.ativo) });
});

const confirmarEmailExistente = asyncHandler(async (req, res) => {
  const dados = confirmarEmailExistenteSchema.parse(req.body);
  const usuario = await usuariosService.buscarPorCpf(dados.cpf);

  const mensagemInvalida = "CPF ou e-mail não conferem.";
  if (!usuario || !usuario.ativo || usuario.email.toLowerCase() !== dados.email.toLowerCase()) {
    throw new ErroHttp(400, mensagemInvalida);
  }

  const token = inscricoesService.gerarTokenInscricao(usuario.id);
  return res.json({ token, nome: usuario.nome });
});

const cadastrar = asyncHandler(async (req, res) => {
  const dados = cadastroInscricaoSchema.parse(req.body);

  const emailExistente = await usuariosService.buscarPorEmail(dados.email);
  if (emailExistente) {
    throw new ErroHttp(409, "Já existe um cadastro com esse e-mail.");
  }

  const cpfExistente = await usuariosService.buscarPorCpf(dados.cpf);
  if (cpfExistente) {
    throw new ErroHttp(409, "Já existe um cadastro com esse CPF.");
  }

  const usuario = await usuariosService.criarUsuarioViaInscricao(dados);
  const token = inscricoesService.gerarTokenInscricao(usuario.id);
  return res.status(201).json({ token, nome: usuario.nome });
});

const tokenPorSessao = asyncHandler(async (req, res) => {
  const usuario = await usuariosService.buscarPorId(req.usuario.id);
  if (!usuario) throw new ErroHttp(404, "Usuário não encontrado.");

  const token = inscricoesService.gerarTokenInscricao(usuario.id);
  return res.json({ token, nome: usuario.nome });
});

const buscarEstado = asyncHandler(async (req, res) => {
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");

  const estado = await inscricoesService.buscarEstadoInscricao(edicao.id, req.usuarioInscricaoId);
  return res.json({ edicao, ...estado });
});

const finalizar = asyncHandler(async (req, res) => {
  const dados = selecionarAtividadesSchema.parse(req.body);
  const edicao = await edicoesService.buscarEdicaoAtual();
  if (!edicao) throw new ErroHttp(404, "Nenhuma edição encontrada.");

  const resultado = await inscricoesService.finalizarInscricao({
    usuarioId: req.usuarioInscricaoId,
    edicaoId: edicao.id,
    atividadeIds: dados.atividadeIds,
  });

  const usuario = await usuariosService.buscarCompletoPorId(req.usuarioInscricaoId);

  try {
    await emailService.enviarEmailConfirmacaoInscricao(usuario, {
      edicao,
      confirmadas: resultado.inscricoesAtividade.filter((i) => i.status === "CONFIRMADA"),
      listaEspera: resultado.inscricoesAtividade.filter((i) => i.status === "LISTA_ESPERA"),
    });
  } catch (erro) {
    console.error("[inscricoes] falha ao enviar e-mail de confirmação:", erro);
  }

  return res.status(201).json(resultado);
});

module.exports = {
  buscarPorCpf,
  confirmarEmailExistente,
  cadastrar,
  tokenPorSessao,
  buscarEstado,
  finalizar,
};
