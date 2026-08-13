const { Router } = require("express");
const inscricoesAtividadeController = require("../controllers/inscricoesAtividade.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

router.get("/", autorizarSecao("INSCRICOES_ATIVIDADES"), inscricoesAtividadeController.listar);
router.post("/", autorizarSecao("INSCRICOES_ATIVIDADES"), inscricoesAtividadeController.criar);
router.patch("/:id", autorizarSecao("INSCRICOES_ATIVIDADES"), inscricoesAtividadeController.atualizar);
router.delete("/:id", autorizarSecao("INSCRICOES_ATIVIDADES"), inscricoesAtividadeController.excluir);

module.exports = router;
