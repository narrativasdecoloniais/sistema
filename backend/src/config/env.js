require("dotenv").config();

function obrigatoria(nome) {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`Variável de ambiente ausente: ${nome}`);
  }
  return valor;
}

module.exports = {
  porta: process.env.PORT || 4000,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  databaseUrl: obrigatoria("DATABASE_URL"),
  jwtAccessSecret: obrigatoria("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: obrigatoria("JWT_REFRESH_SECRET"),
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "Narrativas <nao-responda@narrativas.unb.br>",
  },
  producao: process.env.NODE_ENV === "production",
};
