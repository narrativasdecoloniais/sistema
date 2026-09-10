const rateLimit = require("express-rate-limit");
const { producao } = require("../config/env");

function criarLimitador(maxProducao) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: producao ? maxProducao : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { mensagem: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
  });
}

// Ações que guardam senha/token ou disparam e-mail pra um endereço arbitrário
// (login, cadastro, recuperação de senha, magic links) — alvo real de força
// bruta ou spam, ficam num limite baixo por IP.
const limitadorSensivel = criarLimitador(20);

// Demais passos dos mesmos fluxos (consultas, continuação de sessão já
// identificada, finalização) — não são alvo de força bruta, mas um fluxo
// legítimo (CPF → identidade/cadastro → estado → finalizar, às vezes com
// retries) já soma várias chamadas; limite bem mais folgado pra não travar
// uso normal, principalmente com várias pessoas na mesma rede/IP.
const limitadorPadrao = criarLimitador(300);

module.exports = { limitadorSensivel, limitadorPadrao };
