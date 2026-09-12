const { Router } = require("express");
const usuariosController = require("../controllers/usuarios.controller");
const autenticar = require("../middlewares/autenticar");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router();

router.use(autenticar);

// Usado pelos forms de inscrição manual (geral e por atividade) e pela busca
// de usuário na tela de Participantes (alteração de e-mail pelo gestor).
router.get("/busca", autorizarSecao("INSCRICOES_GERAIS", "INSCRICOES_ATIVIDADES", "PARTICIPANTES"), usuariosController.buscar);
router.patch("/:id/email", autorizarSecao("PARTICIPANTES"), usuariosController.atualizarEmailUsuario);
router.get("/me", usuariosController.meuPerfil);
router.patch("/me", usuariosController.atualizarMeuPerfil);
router.patch("/me/senha", usuariosController.alterarMinhaSenha);
router.delete("/me", usuariosController.excluirMinhaConta);

module.exports = router;
