const { Router } = require("express");
const submissoesAdminController = require("../controllers/submissoesAdmin.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

router.get("/", autorizarSecao("SUBMISSOES_RECEBIMENTO"), submissoesAdminController.listar);
router.delete("/:id", autorizarSecao("SUBMISSOES_RECEBIMENTO"), submissoesAdminController.excluir);
router.patch("/:id/area", autorizarSecao("SUBMISSOES_RECEBIMENTO"), submissoesAdminController.alterarArea);

// Editor em tela cheia — aberto pelo botão Editar das tabelas de Recebimento,
// Avaliação, Resultado e Apresentação, então vale para qualquer uma delas.
const SECOES_EDITOR = [
  "SUBMISSOES_RECEBIMENTO",
  "SUBMISSOES_AVALIACAO",
  "SUBMISSOES_RESULTADO",
  "SUBMISSOES_APRESENTACAO",
];
router.get("/:id/conteudo", autorizarSecao(...SECOES_EDITOR), submissoesAdminController.buscarConteudo);
router.patch("/:id/conteudo", autorizarSecao(...SECOES_EDITOR), submissoesAdminController.salvarConteudo);
router.post("/:id/imagens", autorizarSecao(...SECOES_EDITOR), submissoesAdminController.enviarImagem);

module.exports = router;
