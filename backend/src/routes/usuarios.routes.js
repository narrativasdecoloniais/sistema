const { Router } = require("express");
const usuariosController = require("../controllers/usuarios.controller");
const autenticar = require("../middlewares/autenticar");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router();

router.use(autenticar);

// Usado só pelos forms de inscrição manual (geral e por atividade).
router.get("/busca", autorizarSecao("INSCRICOES_GERAIS", "INSCRICOES_ATIVIDADES"), usuariosController.buscar);
router.get("/me", usuariosController.meuPerfil);
router.patch("/me", usuariosController.atualizarMeuPerfil);
router.patch("/me/senha", usuariosController.alterarMinhaSenha);
router.delete("/me", usuariosController.excluirMinhaConta);

module.exports = router;
