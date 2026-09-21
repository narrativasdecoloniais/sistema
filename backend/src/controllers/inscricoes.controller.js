const asyncHandler = require("../utils/asyncHandler");
const ErroHttp = require("../utils/erroHttp");
const {
  cpfLookupSchema,
  confirmarEmailExistenteSchema,
  cadastroInscricaoSchema,
  vinculoSolicitarSchema,
  vinculoConfirmarSchema,
  selecionarAtividadesSchema,
} = require("../validators/inscricoes.validators");
const usuariosService = require("../services/usuarios.service");
const edicoesService = require("../services/edicoes.service");
const inscricoesService = require("../services/inscricoes.service");
const emailService = require("../services/email.service");
const tokenService = require("../services/token.service");

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
  if (emailExistente && emailExistente.ativo) {
    if (emailExistente.cpf) {
      throw new ErroHttp(409, "Já existe um cadastro com esse e-mail, associado a outro CPF.");
    }

    const cpfExistente = await usuariosService.buscarPorCpf(dados.cpf);
    if (cpfExistente) {
      throw new ErroHttp(409, "Já existe um cadastro com esse CPF.");
    }

    const usuario = await usuariosService.vincularCpfAoUsuario(emailExistente.id, dados.cpf);
    const token = inscricoesService.gerarTokenInscricao(usuario.id);
    return res.json({ token, nome: usuario.nome });
  }

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

// Quem tem conta importada (Even3) ou criada por submissão não tem CPF, então
// "CPF novo" na inscrição não significa "pessoa nova" — se ela usar outro
// e-mail no cadastro, nasce uma conta duplicada. Este par de rotas deixa a
// pessoa provar posse do e-mail da conta antiga (código enviado pra lá) e
// vincular o CPF a ela. A resposta de "solicitar" é sempre a mesma, exista ou
// não a conta, pra não vazar quais e-mails estão cadastrados.
const MENSAGEM_VINCULO_ENVIADO =
  "Se houver um cadastro com esse e-mail, enviamos um código para ele. Ele vale por 30 minutos.";

const solicitarVinculo = asyncHandler(async (req, res) => {
  const dados = vinculoSolicitarSchema.parse(req.body);

  const cpfExistente = await usuariosService.buscarPorCpf(dados.cpf);
  const conta = cpfExistente ? null : await usuariosService.buscarContaSemCpfPorEmail(dados.email);

  if (conta) {
    const codigo = await tokenService.criarCodigoVinculoConta(conta.id);
    try {
      await emailService.enviarEmailVinculoConta(conta, codigo);
    } catch (erro) {
      console.error("[inscricoes] falha ao enviar código de vínculo:", erro);
    }
  }

  return res.json({ mensagem: MENSAGEM_VINCULO_ENVIADO });
});

const confirmarVinculo = asyncHandler(async (req, res) => {
  const dados = vinculoConfirmarSchema.parse(req.body);

  const mensagemInvalida = "Código inválido ou expirado. Peça um novo código.";
  const conta = await usuariosService.buscarContaSemCpfPorEmail(dados.email);
  if (!conta) throw new ErroHttp(400, mensagemInvalida);

  const cpfExistente = await usuariosService.buscarPorCpf(dados.cpf);
  if (cpfExistente) throw new ErroHttp(409, "Já existe um cadastro com esse CPF.");

  const registro = await tokenService.consumirCodigoVinculoConta(conta.id, dados.codigo);
  if (!registro) throw new ErroHttp(400, mensagemInvalida);

  const usuario = await usuariosService.vincularCpfAoUsuario(conta.id, dados.cpf, {
    confirmarEmail: true,
  });
  const token = inscricoesService.gerarTokenInscricao(usuario.id);
  return res.json({ token, nome: usuario.nome });
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
  const inscricoesNovas = resultado.inscricoesAtividade.filter((i) => resultado.novas.includes(i.id));

  // Quando o usuário já estava inscrito e não adicionou nenhuma atividade nova
  // (corrida ou reenvio), não há nada novo para notificar por e-mail.
  if (!resultado.jaEstavaInscrito || inscricoesNovas.length > 0) {
    try {
      await emailService.enviarEmailConfirmacaoInscricao(usuario, {
        edicao,
        confirmadas: inscricoesNovas.filter((i) => i.status === "CONFIRMADA"),
        listaEspera: inscricoesNovas.filter((i) => i.status === "LISTA_ESPERA"),
        jaEstavaInscrito: resultado.jaEstavaInscrito,
      });
    } catch (erro) {
      console.error("[inscricoes] falha ao enviar e-mail de confirmação:", erro);
    }
  }

  return res.status(201).json(resultado);
});

const cancelarAtividade = asyncHandler(async (req, res) => {
  await inscricoesService.cancelarInscricaoAtividade(
    req.usuarioInscricaoId,
    req.params.inscricaoAtividadeId
  );
  return res.status(204).send();
});

module.exports = {
  buscarPorCpf,
  confirmarEmailExistente,
  cadastrar,
  solicitarVinculo,
  confirmarVinculo,
  tokenPorSessao,
  buscarEstado,
  finalizar,
  cancelarAtividade,
};
