const { Router } = require("express");
const controller = require("../controllers/credenciamento.controller");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router({ mergeParams: true });

router.use(autorizarSecao("CREDENCIAMENTO"));

// Leitor de crachás (e busca de reserva): evento ou presença numa atividade
router.post("/leitura", controller.ler);

// Credenciamento geral (uma vez no evento)
router.get("/", controller.listar);
router.get("/qr", controller.qrEvento);
router.get("/lista-impressa", controller.listaImpressaEvento);
router.post("/lote", controller.credenciarEmLote);
router.post("/qr/novo", controller.novoQrEvento);
router.post("/usuarios/:usuarioId", controller.credenciar);
router.delete("/usuarios/:usuarioId", controller.desfazer);

// Presença nas atividades que exigem inscrição
router.get("/atividades", controller.listarAtividades);
router.get("/atividades/qr", controller.qrTodasAtividades);
router.get("/atividades/lista-impressa", controller.listasImpressasAtividades);
router.get("/atividades/:atividadeId", controller.listarPresencas);
router.get("/atividades/:atividadeId/qr", controller.qrAtividade);
router.post("/atividades/:atividadeId/qr/novo", controller.novoQrAtividade);
router.get("/atividades/:atividadeId/lista-impressa", controller.listaImpressaAtividade);
router.post("/atividades/:atividadeId/presencas/lote", controller.registrarPresencasEmLote);
router.post("/atividades/:atividadeId/presencas/:usuarioId", controller.registrarPresenca);
router.delete("/atividades/:atividadeId/presencas/:usuarioId", controller.removerPresenca);

module.exports = router;
