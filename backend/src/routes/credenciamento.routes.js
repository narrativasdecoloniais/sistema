const { Router } = require("express");
const controller = require("../controllers/credenciamento.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

router.use(autorizarSecao("CREDENCIAMENTO"));

// Credenciamento geral (uma vez no evento)
router.get("/", controller.listar);
router.get("/qr", controller.qrEvento);
router.post("/qr/novo", controller.novoQrEvento);
router.post("/usuarios/:usuarioId", controller.credenciar);
router.delete("/usuarios/:usuarioId", controller.desfazer);

// Presença nas atividades que exigem inscrição
router.get("/atividades", controller.listarAtividades);
router.get("/atividades/qr", controller.qrTodasAtividades);
router.get("/atividades/:atividadeId", controller.listarPresencas);
router.get("/atividades/:atividadeId/qr", controller.qrAtividade);
router.post("/atividades/:atividadeId/qr/novo", controller.novoQrAtividade);
router.post("/atividades/:atividadeId/presencas/:usuarioId", controller.registrarPresenca);
router.delete("/atividades/:atividadeId/presencas/:usuarioId", controller.removerPresenca);

module.exports = router;
