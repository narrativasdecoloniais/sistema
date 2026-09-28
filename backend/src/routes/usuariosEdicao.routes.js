const { Router } = require("express");
const usuariosEdicaoController = require("../controllers/usuariosEdicao.controller");
const autorizar = require("../middlewares/autorizar");

const router = Router({ mergeParams: true });

// ADMIN-only de propósito, mesmo dentro da tela "Participantes": expõe
// nome/e-mail/CPF da base inteira (e o painel permite exportar em Excel),
// o que vai além do que um ORGANIZADOR com a seção PARTICIPANTES precisa.
router.get("/", autorizar("ADMIN"), usuariosEdicaoController.listar);

module.exports = router;
