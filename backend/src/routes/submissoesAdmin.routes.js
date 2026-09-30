const { Router } = require("express");
const submissoesAdminController = require("../controllers/submissoesAdmin.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

router.get("/", autorizarSecao("SUBMISSOES_RECEBIMENTO"), submissoesAdminController.listar);
router.post("/", autorizarSecao("SUBMISSOES_RECEBIMENTO"), submissoesAdminController.criar);
router.delete("/:id", autorizarSecao("SUBMISSOES_RECEBIMENTO"), submissoesAdminController.excluir);
// Troca de área pelo modal de detalhe — usado no Recebimento e na Apresentação.
router.patch(
  "/:id/area",
  autorizarSecao("SUBMISSOES_RECEBIMENTO", "SUBMISSOES_APRESENTACAO"),
  submissoesAdminController.alterarArea
);

// Editor em tela cheia — aberto pelo botão Editar das tabelas de Recebimento,
// Avaliação, Resultado, Apresentação e Publicação (Anais), então vale para
// qualquer uma delas.
const SECOES_EDITOR = [
  "SUBMISSOES_RECEBIMENTO",
  "SUBMISSOES_AVALIACAO",
  "SUBMISSOES_RESULTADO",
  "SUBMISSOES_APRESENTACAO",
  "SUBMISSOES_PUBLICACAO",
];
router.get("/:id/conteudo", autorizarSecao(...SECOES_EDITOR), submissoesAdminController.buscarConteudo);
router.patch("/:id/conteudo", autorizarSecao(...SECOES_EDITOR), submissoesAdminController.salvarConteudo);
router.post("/:id/imagens", autorizarSecao(...SECOES_EDITOR), submissoesAdminController.enviarImagem);

module.exports = router;
