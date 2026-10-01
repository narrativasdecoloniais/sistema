const { Router } = require("express");
const emailsMassaController = require("../controllers/emailsMassa.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");
const { limitadorPadrao } = require("../middlewares/rateLimiter");

// E-mails em massa — só ADMIN (os destinatários vêm da aba Usuários de
// Participantes, que já é ADMIN-only por expor a base inteira).
const router = Router();

router.use(autenticar, autorizar("ADMIN"));

router.get("/modelos", emailsMassaController.listarModelos);
router.post("/modelos", emailsMassaController.criarModelo);
router.patch("/modelos/:id", emailsMassaController.atualizarModelo);
router.delete("/modelos/:id", emailsMassaController.excluirModelo);
router.post("/teste", limitadorPadrao, emailsMassaController.enviarTeste);
router.get("/uso-mensal", emailsMassaController.usoMensal);
router.get("/envios", emailsMassaController.listarEnvios);
router.get("/envios/:id", emailsMassaController.detalharEnvio);
router.post("/envios", emailsMassaController.criarEnvio);
router.post("/envios/:id/retomar", emailsMassaController.retomarEnvio);

module.exports = router;
