const { Router } = require("express");
const organizadoresController = require("../controllers/organizadores.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = Router();

router.use(autenticar, autorizar("ADMIN"));

router.get("/", organizadoresController.listar);
router.post("/", organizadoresController.criar);
router.patch("/:id/promover", organizadoresController.promover);
router.delete("/:id", organizadoresController.excluir);

module.exports = router;
