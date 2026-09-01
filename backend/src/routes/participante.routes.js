const { Router } = require("express");
const autenticar = require("../middlewares/autenticar");
const participanteInscricoesRoutes = require("./participanteInscricoes.routes");
const participanteSubmissoesRoutes = require("./participanteSubmissoes.routes");

const router = Router();

// Área do participante logado — protegida só por autenticar (cookie de
// sessão), sem token intermediário: esse token só existe pra sustentar os
// fluxos públicos sem sessão real (CPF ou link mágico por e-mail).
router.use(autenticar);

router.use("/inscricoes", participanteInscricoesRoutes);
router.use("/submissoes", participanteSubmissoesRoutes);

module.exports = router;
