const rateLimit = require("express-rate-limit");
const { producao } = require("../config/env");

const limitadorAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: producao ? 20 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensagem: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
});

module.exports = { limitadorAuth };
