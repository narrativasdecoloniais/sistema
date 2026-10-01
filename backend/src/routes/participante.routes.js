const { Router } = require("express");
const autenticar = require("../middlewares/autenticar");
const participanteInscricoesRoutes = require("./participanteInscricoes.routes");
const participanteSubmissoesRoutes = require("./participanteSubmissoes.routes");
const participanteAvaliacoesRoutes = require("./participanteAvaliacoes.routes");
const participanteMonitoriaRoutes = require("./participanteMonitoria.routes");
const participanteCredenciamentoRoutes = require("./participanteCredenciamento.routes");
const participanteCertificadosRoutes = require("./participanteCertificados.routes");
const participanteCoautoriasRoutes = require("./participanteCoautorias.routes");
const asyncHandler = require("../utils/asyncHandler");
const participanteResumoService = require("../services/participanteResumo.service");

const router = Router();

// Área do participante logado — protegida só por autenticar (cookie de
// sessão), sem token intermediário: esse token só existe pra sustentar os
// fluxos públicos sem sessão real (CPF ou link mágico por e-mail).
router.use(autenticar);

// Tela "Início": situação em cada recurso e o que há a fazer.
router.get(
  "/resumo",
  asyncHandler(async (req, res) => {
    return res.json(await participanteResumoService.resumir(req.usuario.id));
  })
);

router.use("/inscricoes", participanteInscricoesRoutes);
router.use("/submissoes", participanteSubmissoesRoutes);
router.use("/monitoria", participanteMonitoriaRoutes);
router.use("/credenciamento", participanteCredenciamentoRoutes);
router.use("/certificados", participanteCertificadosRoutes);
router.use("/coautorias", participanteCoautoriasRoutes);
// Qualquer logado pode chamar; só vê as atribuições que são dele.
router.use("/avaliacoes", participanteAvaliacoesRoutes);

module.exports = router;
