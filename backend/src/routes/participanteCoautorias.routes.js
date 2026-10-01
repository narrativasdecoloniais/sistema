const { Router } = require("express");
const participanteCoautoriasController = require("../controllers/participanteCoautorias.controller");
const { limitadorPorUsuario } = require("../middlewares/rateLimiter");

const router = Router();

// "Já tenho conta" do convite de coautor: o token prova o e-mail do convite
// e a sessão prova a conta.
router.post("/vincular", limitadorPorUsuario, participanteCoautoriasController.vincular);

module.exports = router;
