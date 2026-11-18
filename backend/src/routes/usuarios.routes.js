const { Router } = require("express");
const usuariosController = require("../controllers/usuarios.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");
const autorizarSecao = require("../middlewares/autorizarSecao");
const { limitadorSensivel } = require("../middlewares/rateLimiter");

const router = Router();

router.use(autenticar);

// Usado pelos forms de inscrição manual (geral e por atividade) e pela busca
// de usuário na tela de Participantes (alteração de e-mail pelo gestor) e na
// inserção de submissão pelo Recebimento (autor principal) e na inclusão de
// monitor(a) pela Coordenação de Monitoria.
router.get("/busca", autorizarSecao.emQualquerEdicao("INSCRICOES_GERAIS", "INSCRICOES_ATIVIDADES", "PARTICIPANTES", "SUBMISSOES_AVALIACAO", "SUBMISSOES_RECEBIMENTO", "CREDENCIAMENTO", "CERTIFICADOS", "MONITORIA"), usuariosController.buscar);
router.patch("/:id/email", autorizarSecao("PARTICIPANTES"), usuariosController.atualizarEmailUsuario);
// Unificação de contas duplicadas da mesma pessoa — mesma seção da alteração
// de e-mail (também é correção de cadastro feita pelo gestor). Contas de
// admin/organizador são bloqueadas no service, então não serve de atalho de
// escalada de privilégio.
// Contas sem CPF (Even3/convite) com possíveis duplicadas — ADMIN-only porque
// expõe CPF/e-mail da base inteira.
router.get("/contas-parecidas", autorizar("ADMIN"), usuariosController.contasParecidas);
router.post("/unificacao/previa", autorizarSecao("PARTICIPANTES"), usuariosController.previaUnificacao);
router.post("/unificacao", autorizarSecao("PARTICIPANTES"), usuariosController.unificarUsuarios);
router.get("/me", usuariosController.meuPerfil);
router.patch("/me", usuariosController.atualizarMeuPerfil);
router.patch("/me/senha", usuariosController.alterarMinhaSenha);
router.post("/me/email/solicitar", limitadorSensivel, usuariosController.solicitarTrocaEmail);
router.post("/me/email/confirmar", limitadorSensivel, usuariosController.confirmarTrocaEmail);
router.delete("/me", usuariosController.excluirMinhaConta);

module.exports = router;
