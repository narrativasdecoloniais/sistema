const rateLimit = require("express-rate-limit");

const limitadorAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensagem: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
});

module.exports = { limitadorAuth };
