const { secoesDoMonitorNaEdicao, acessoMonitorPorEdicao } = require("../utils/acessoMonitor");

// Admin sempre; organizador com acesso completo ou a seção; e, nas rotas de
// uma edição (/edicoes/:edicaoId/... ou /edicoes/:id), monitor selecionado
// naquela edição cuja configuração (Edicao.secoesMonitores) libera a seção.
function criarMiddleware(secoes, { qualquerEdicao = false } = {}) {
  return async (req, res, next) => {
    try {
      const { papeis = [], acessoCompleto, secoesPermitidas = [] } = req.usuario || {};

      if (papeis.includes("ADMIN")) return next();

      if (papeis.includes("ORGANIZADOR")) {
        const liberado = acessoCompleto || secoes.some((secao) => secoesPermitidas.includes(secao));
        if (liberado) return next();
      }

      // `edicaoId` vem das rotas aninhadas; `id` só é a edição em /edicoes/:id.
      // `qualquerEdicao` serve a consultas que não são de uma edição (ex.: busca
      // de usuário pelo credenciamento): vale se alguma edição libera a seção.
      const edicaoId = req.params?.edicaoId || req.params?.id;
      const secoesMonitor = qualquerEdicao
        ? Object.values(await acessoMonitorPorEdicao(req.usuario?.id)).flat()
        : await secoesDoMonitorNaEdicao(req.usuario?.id, edicaoId);
      if (secoes.some((secao) => secoesMonitor.includes(secao))) return next();

      return res.status(403).json({ mensagem: "Você não tem permissão para acessar este recurso." });
    } catch (erro) {
      return next(erro);
    }
  };
}

const autorizarSecao = (...secoes) => criarMiddleware(secoes);
autorizarSecao.emQualquerEdicao = (...secoes) => criarMiddleware(secoes, { qualquerEdicao: true });

module.exports = autorizarSecao;
