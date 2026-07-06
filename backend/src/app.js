const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const env = require("./config/env");
const authRoutes = require("./routes/auth.routes");
const usuariosRoutes = require("./routes/usuarios.routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/saude", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/usuarios", usuariosRoutes);

app.use((req, res) => {
  res.status(404).json({ mensagem: "Rota não encontrada." });
});

app.use(errorHandler);

module.exports = app;
