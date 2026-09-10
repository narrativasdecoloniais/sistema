const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const { limitadorSensivel, limitadorPadrao } = require("../middlewares/rateLimiter");

const router = Router();

router.post("/cadastro", limitadorSensivel, authController.cadastrar);
router.get("/confirmar-email", limitadorPadrao, authController.confirmarEmail);
router.post("/reenviar-confirmacao", limitadorSensivel, authController.reenviarConfirmacao);
router.post("/login", limitadorSensivel, authController.login);
router.post("/refresh", limitadorPadrao, authController.refresh);
router.post("/logout", limitadorPadrao, authController.logout);
router.post("/recuperar-senha", limitadorSensivel, authController.recuperarSenha);
router.post("/redefinir-senha", limitadorPadrao, authController.redefinirSenha);
router.post("/definir-senha", limitadorPadrao, authController.definirSenha);

module.exports = router;
