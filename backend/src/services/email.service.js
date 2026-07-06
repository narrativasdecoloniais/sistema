const nodemailer = require("nodemailer");
const env = require("../config/env");

let transportadorPromise;

async function obterTransportador() {
  if (transportadorPromise) return transportadorPromise;

  if (env.smtp.host) {
    transportadorPromise = Promise.resolve(
      nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.port === 465,
        auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
      })
    );
    return transportadorPromise;
  }

  // Sem SMTP configurado: cria uma conta de teste Ethereal para não perder o e-mail em dev.
  transportadorPromise = nodemailer.createTestAccount().then((conta) =>
    nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: conta.user, pass: conta.pass },
    })
  );
  return transportadorPromise;
}

async function enviarEmail({ para, assunto, html }) {
  const transportador = await obterTransportador();
  const info = await transportador.sendMail({
    from: env.smtp.from,
    to: para,
    subject: assunto,
    html,
  });

  const urlPreview = nodemailer.getTestMessageUrl(info);
  if (urlPreview) {
    console.log(`[email] "${assunto}" para ${para} — preview: ${urlPreview}`);
  } else {
    console.log(`[email] "${assunto}" enviado para ${para}`);
  }
}

async function enviarEmailConfirmacao(usuario, token) {
  const link = `${env.frontendUrl}/confirmar-email?token=${token}`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Confirme seu e-mail — Narrativas",
    html: `<p>Olá, ${usuario.nome}.</p><p>Confirme seu cadastro no Narrativas clicando no link abaixo:</p><p><a href="${link}">${link}</a></p><p>Se você não fez esse cadastro, ignore este e-mail.</p>`,
  });
}

async function enviarEmailRecuperacaoSenha(usuario, token) {
  const link = `${env.frontendUrl}/redefinir-senha?token=${token}`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Recuperação de senha — Narrativas",
    html: `<p>Olá, ${usuario.nome}.</p><p>Recebemos um pedido para redefinir sua senha. Clique no link abaixo para escolher uma nova senha:</p><p><a href="${link}">${link}</a></p><p>Se você não pediu isso, ignore este e-mail.</p>`,
  });
}

module.exports = { enviarEmailConfirmacao, enviarEmailRecuperacaoSenha };
