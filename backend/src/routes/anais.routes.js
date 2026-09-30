const { Router } = require("express");
const anaisController = require("../controllers/anais.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

// Anais da edição: configuração, publicação, artigos, moderação de
// comentários e geração do PDF/Word — tudo na seção Publicação.
router.use(autorizarSecao("SUBMISSOES_PUBLICACAO"));

router.get("/", anaisController.painel);
router.put("/configuracao", anaisController.salvarConfiguracao);
router.patch("/publicacao", anaisController.definirPublicacao);
router.get("/artigos", anaisController.listarArtigos);
router.patch("/artigos/ocultacao", anaisController.definirOcultacao);
router.get("/comentarios", anaisController.listarComentarios);
router.patch("/comentarios/:id", anaisController.definirOcultacaoComentario);
router.delete("/comentarios/:id", anaisController.excluirComentario);
router.post("/arquivos/:formato", anaisController.gerarArquivo);

module.exports = router;
