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
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "Narrativas <onboarding@resend.dev>",
  producao: process.env.NODE_ENV === "production",
};
