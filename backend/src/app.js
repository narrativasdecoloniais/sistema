const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const env = require("./config/env");
const authRoutes = require("./routes/auth.routes");
const usuariosRoutes = require("./routes/usuarios.routes");
const edicoesRoutes = require("./routes/edicoes.routes");
const participanteRoutes = require("./routes/participante.routes");
const organizadoresRoutes = require("./routes/organizadores.routes");
const tiposAtividadeRoutes = require("./routes/tiposAtividade.routes");
const tiposParticipacaoRoutes = require("./routes/tiposParticipacao.routes");
const tiposPontoInteresseRoutes = require("./routes/tiposPontoInteresse.routes");
const publicoRoutes = require("./routes/publico.routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
// 2mb era suficiente pra logo/faixa (dimensaoMax 480px) e pro SVG da logo
// (máx. 300KB), mas o fundo full-bleed da Hero permite até 2560x1440
// (imagemFundoHero* aceita até 20_000_000 caracteres no validator) — o corpo
// da requisição precisa de espaço acima disso.
app.use(express.json({ limit: "25mb" }));
app.use(cookieParser());

app.get("/saude", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/edicoes", edicoesRoutes);
app.use("/participante", participanteRoutes);
app.use("/organizadores", organizadoresRoutes);
app.use("/tipos-atividade", tiposAtividadeRoutes);
app.use("/tipos-participacao", tiposParticipacaoRoutes);
app.use("/tipos-ponto-interesse", tiposPontoInteresseRoutes);
app.use("/publico", publicoRoutes);

app.use((req, res) => {
  res.status(404).json({ mensagem: "Rota não encontrada." });
});

app.use(errorHandler);

module.exports = app;
