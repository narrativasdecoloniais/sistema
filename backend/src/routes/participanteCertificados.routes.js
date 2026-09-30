const { Router } = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { limitadorPorUsuario } = require("../middlewares/rateLimiter");
const { enviarPdf } = require("../controllers/certificados.controller");
const certificadosService = require("../services/certificados.service");

const router = Router();

// Só certificados de tipos liberados, não revogados, da própria conta (ou da
// autoria ligada a ela).
router.get(
  "/",
  asyncHandler(async (req, res) => {
    return res.json({ certificados: await certificadosService.listarDoParticipante(req.usuario.id) });
  })
);

router.get(
  "/:id/pdf",
  limitadorPorUsuario,
  asyncHandler(async (req, res) => {
    return enviarPdf(res, await certificadosService.pdfDoParticipante(req.usuario.id, req.params.id));
  })
);

module.exports = router;
