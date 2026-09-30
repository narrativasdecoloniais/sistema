const asyncHandler = require("../utils/asyncHandler");
const anaisService = require("../services/anais.service");
const geracaoAnaisService = require("../services/geracaoAnais.service");
const {
  anaisConfiguracaoSchema,
  publicacaoSchema,
  ocultacaoArtigosSchema,
  ocultacaoComentarioSchema,
  formatoArquivoSchema,
} = require("../validators/anais.validators");

const painel = asyncHandler(async (req, res) => {
  const { edicaoId } = req.params;
  return res.json(
    await anaisService.obterPainel(edicaoId, { geracaoEmAndamento: geracaoAnaisService.emAndamento(edicaoId) })
  );
});

const salvarConfiguracao = asyncHandler(async (req, res) => {
  const dados = anaisConfiguracaoSchema.parse(req.body);
  const anais = await anaisService.salvarConfiguracao(req.params.edicaoId, dados);
  return res.json({ anais, mensagem: "Configurações dos Anais salvas." });
});

const definirPublicacao = asyncHandler(async (req, res) => {
  const { publicado } = publicacaoSchema.parse(req.body);
  const anais = await anaisService.definirPublicacao(req.params.edicaoId, publicado);
  return res.json({
    anais,
    mensagem: publicado ? "Anais publicados no site." : "Anais retirados do site.",
  });
});

const listarArtigos = asyncHandler(async (req, res) => {
  return res.json({ artigos: await anaisService.listarArtigosAdmin(req.params.edicaoId) });
});

const definirOcultacao = asyncHandler(async (req, res) => {
  const { ids, oculto } = ocultacaoArtigosSchema.parse(req.body);
  const total = await anaisService.definirOcultacao(req.params.edicaoId, ids, oculto);
  const plural = total === 1 ? "trabalho" : "trabalhos";
  return res.json({
    total,
    mensagem: oculto ? `${total} ${plural} ocultado(s) dos Anais.` : `${total} ${plural} de volta aos Anais.`,
  });
});

const listarComentarios = asyncHandler(async (req, res) => {
  return res.json({ comentarios: await anaisService.listarComentariosAdmin(req.params.edicaoId) });
});

const definirOcultacaoComentario = asyncHandler(async (req, res) => {
  const { oculto } = ocultacaoComentarioSchema.parse(req.body);
  const comentario = await anaisService.definirOcultacaoComentario(
    req.params.edicaoId,
    req.params.id,
    oculto,
    req.usuario.id
  );
  return res.json({ comentario, mensagem: oculto ? "Comentário ocultado." : "Comentário visível de novo." });
});

const excluirComentario = asyncHandler(async (req, res) => {
  await anaisService.excluirComentarioAdmin(req.params.edicaoId, req.params.id);
  return res.json({ mensagem: "Comentário excluído." });
});

const gerarArquivo = asyncHandler(async (req, res) => {
  const formato = formatoArquivoSchema.parse(req.params.formato);
  await geracaoAnaisService.iniciarGeracao(req.params.edicaoId, formato);
  return res.status(202).json({
    mensagem: `Gerando os Anais em ${formato === "pdf" ? "PDF" : "Word"}. Isso pode levar alguns minutos.`,
  });
});

module.exports = {
  painel,
  salvarConfiguracao,
  definirPublicacao,
  listarArtigos,
  definirOcultacao,
  listarComentarios,
  definirOcultacaoComentario,
  excluirComentario,
  gerarArquivo,
};
