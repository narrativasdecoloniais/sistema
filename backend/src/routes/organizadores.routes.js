const { Router } = require("express");
const organizadoresController = require("../controllers/organizadores.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");
const autorizarSecao = require("../middlewares/autorizarSecao");

const router = Router();

router.use(autenticar);

// Leitura: liberada pra quem tem a seção PARTICIPANTES (ou ADMIN).
router.get("/", autorizarSecao("PARTICIPANTES"), organizadoresController.listar);
// Mutações: sempre ADMIN — conceder/editar permissão nunca pode depender
// só da seção PARTICIPANTES, senão um organizador comum promoveria a si
// mesmo ou a terceiros a admin/acesso completo.
router.post("/", autorizar("ADMIN"), organizadoresController.criar);
router.patch("/:id/promover", autorizar("ADMIN"), organizadoresController.promover);
router.patch("/:id/permissoes", autorizar("ADMIN"), organizadoresController.atualizarPermissoes);
router.delete("/:id", autorizar("ADMIN"), organizadoresController.excluir);

module.exports = router;
