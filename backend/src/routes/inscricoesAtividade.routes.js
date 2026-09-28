const { Router } = require("express");
const inscricoesAtividadeController = require("../controllers/inscricoesAtividade.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

router.get("/", autorizarSecao("INSCRICOES_ATIVIDADES"), inscricoesAtividadeController.listar);
router.post("/", autorizarSecao("INSCRICOES_ATIVIDADES"), inscricoesAtividadeController.criar);
// POST (e não DELETE com corpo) porque proxies/clients nem sempre repassam
// corpo em DELETE.
router.post(
  "/exclusao-em-lote",
  autorizarSecao("INSCRICOES_ATIVIDADES"),
  inscricoesAtividadeController.excluirEmLote
);
router.patch("/:id", autorizarSecao("INSCRICOES_ATIVIDADES"), inscricoesAtividadeController.atualizar);
router.delete("/:id", autorizarSecao("INSCRICOES_ATIVIDADES"), inscricoesAtividadeController.excluir);

module.exports = router;
