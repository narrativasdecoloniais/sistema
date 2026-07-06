const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const { limitadorAuth } = require("../middlewares/rateLimiter");

const router = Router();

router.use(limitadorAuth);

router.post("/cadastro", authController.cadastrar);
router.get("/confirmar-email", authController.confirmarEmail);
router.post("/reenviar-confirmacao", authController.reenviarConfirmacao);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/recuperar-senha", authController.recuperarSenha);
router.post("/redefinir-senha", authController.redefinirSenha);

module.exports = router;
