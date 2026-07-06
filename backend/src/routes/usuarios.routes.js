const { Router } = require("express");
const usuariosController = require("../controllers/usuarios.controller");
const autenticar = require("../middlewares/autenticar");

const router = Router();

router.use(autenticar);

router.get("/me", usuariosController.meuPerfil);
router.patch("/me", usuariosController.atualizarMeuPerfil);
router.patch("/me/senha", usuariosController.alterarMinhaSenha);
router.delete("/me", usuariosController.excluirMinhaConta);

module.exports = router;
