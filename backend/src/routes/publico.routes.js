const { Router } = require("express");
const publicoController = require("../controllers/publico.controller");
const submissoesPublicoRoutes = require("./submissoesPublico.routes");
const regularizacaoContasRoutes = require("./regularizacaoContas.routes");

const router = Router();

router.get("/edicao-atual", publicoController.buscarEdicaoAtual);
router.get("/edicao-atual/trabalhos-aprovados", publicoController.listarTrabalhosAprovados);
router.get("/edicoes-anteriores", publicoController.listarEdicoesAnteriores);
router.get("/edicao-atual/atividades", publicoController.listarAtividades);
router.get("/edicao-atual/atividades/:slug", publicoController.buscarAtividadePorSlug);
router.get("/edicao-atual/modalidades-submissao", publicoController.listarModalidadesSubmissao);
router.get(
  "/edicao-atual/modalidades-submissao/:slug",
  publicoController.buscarModalidadeSubmissaoPorSlug
);
router.get("/edicao-atual/grupos-conteudo", publicoController.listarGruposConteudo);
router.get("/edicoes/:slug", publicoController.buscarEdicaoPorSlug);
router.get("/edicoes/:slug/atividades", publicoController.listarAtividadesPorEdicaoSlug);
router.get(
  "/edicoes/:edicaoSlug/atividades/:atividadeSlug",
  publicoController.buscarAtividadePorEdicaoSlug
);
router.use("/submissao", submissoesPublicoRoutes);
router.use("/regularizacao", regularizacaoContasRoutes);

module.exports = router;
