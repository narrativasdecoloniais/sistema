const { Router } = require("express");
const edicoesController = require("../controllers/edicoes.controller");
const atividadesRoutes = require("./atividades.routes");
const inscricoesEdicaoRoutes = require("./inscricoesEdicao.routes");
const inscricoesAtividadeRoutes = require("./inscricoesAtividade.routes");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = Router();

router.use(autenticar);

router.get("/", autorizar("ADMIN", "ORGANIZADOR"), edicoesController.listar);
router.get("/:id", autorizar("ADMIN", "ORGANIZADOR"), edicoesController.buscarPorId);
router.post("/", autorizar("ADMIN"), edicoesController.criar);
router.patch("/:id", autorizar("ADMIN", "ORGANIZADOR"), edicoesController.atualizar);
router.delete("/:id", autorizar("ADMIN"), edicoesController.excluir);

router.use("/:edicaoId/atividades", atividadesRoutes);
router.use("/:edicaoId/inscricoes-gerais", inscricoesEdicaoRoutes);
router.use("/:edicaoId/inscricoes-atividades", inscricoesAtividadeRoutes);

module.exports = router;
