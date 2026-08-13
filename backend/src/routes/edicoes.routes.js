const { Router } = require("express");
const edicoesController = require("../controllers/edicoes.controller");
const atividadesRoutes = require("./atividades.routes");
const inscricoesEdicaoRoutes = require("./inscricoesEdicao.routes");
const inscricoesAtividadeRoutes = require("./inscricoesAtividade.routes");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router();

router.use(autenticar);

// GET não tem seção única: é a base do dashboard "Início" e pré-requisito
// de qualquer sub-tela da edição — fica aberto a qualquer ADMIN/ORGANIZADOR.
router.get("/", autorizar("ADMIN", "ORGANIZADOR"), edicoesController.listar);
router.get("/:id", autorizar("ADMIN", "ORGANIZADOR"), edicoesController.buscarPorId);
router.post("/", autorizar("ADMIN"), edicoesController.criar);
// Atende duas telas do menu (Configurações > Evento e Página do evento),
// ambas salvando no mesmo PATCH /edicoes/:id.
router.patch("/:id", autorizarSecao("CONFIGURACOES_EVENTO", "PAGINA_EVENTO"), edicoesController.atualizar);
router.delete("/:id", autorizar("ADMIN"), edicoesController.excluir);

router.use("/:edicaoId/atividades", atividadesRoutes);
router.use("/:edicaoId/inscricoes-gerais", inscricoesEdicaoRoutes);
router.use("/:edicaoId/inscricoes-atividades", inscricoesAtividadeRoutes);

module.exports = router;
