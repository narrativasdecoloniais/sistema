const asyncHandler = require("../utils/asyncHandler");
const { selecionarAtividadesSchema } = require("../validators/inscricoes.validators");
const participanteInscricoesService = require("../services/participanteInscricoes.service");
const edicoesService = require("../services/edicoes.service");
const usuariosService = require("../services/usuarios.service");
const emailService = require("../services/email.service");

const listar = asyncHandler(async (req, res) => {
  const inscricoes = await participanteInscricoesService.listarParaUsuario(req.usuario.id);
  return res.json({ inscricoes });
});

const buscarEstado = asyncHandler(async (req, res) => {
  const estado = await participanteInscricoesService.buscarEstado(req.usuario.id, req.params.edicaoId);
  return res.json(estado);
});

const inscrever = asyncHandler(async (req, res) => {
  const dados = selecionarAtividadesSchema.parse(req.body);

  const resultado = await participanteInscricoesService.inscreverOuAtualizar(
    req.usuario.id,
    req.params.edicaoId,
    dados.atividadeIds
  );

  const usuario = await usuariosService.buscarCompletoPorId(req.usuario.id);
  const edicao = await edicoesService.buscarPorId(req.params.edicaoId);
  const inscricoesNovas = resultado.inscricoesAtividade.filter((i) => resultado.novas.includes(i.id));

  if (!resultado.jaEstavaInscrito || inscricoesNovas.length > 0) {
    try {
      await emailService.enviarEmailConfirmacaoInscricao(usuario, {
        edicao,
        confirmadas: inscricoesNovas.filter((i) => i.status === "CONFIRMADA"),
        listaEspera: inscricoesNovas.filter((i) => i.status === "LISTA_ESPERA"),
        jaEstavaInscrito: resultado.jaEstavaInscrito,
      });
    } catch (erro) {
      console.error("[participanteInscricoes] falha ao enviar e-mail de confirmação:", erro);
    }
  }

  return res.status(201).json(resultado);
});

const cancelarAtividade = asyncHandler(async (req, res) => {
  await participanteInscricoesService.cancelarAtividade(
    req.usuario.id,
    req.params.edicaoId,
    req.params.inscricaoAtividadeId
  );
  return res.status(204).send();
});

const cancelarGeral = asyncHandler(async (req, res) => {
  await participanteInscricoesService.cancelarGeral(req.usuario.id, req.params.edicaoId);
  return res.status(204).send();
});

module.exports = {
  listar,
  buscarEstado,
  inscrever,
  cancelarAtividade,
  cancelarGeral,
};
