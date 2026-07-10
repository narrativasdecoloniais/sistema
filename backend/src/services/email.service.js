const nodemailer = require("nodemailer");
const env = require("../config/env");

// Railway (e a maioria dos PaaS) bloqueia portas de SMTP (25/465/587) no
// tráfego de saída para prevenir abuso, então em produção o envio precisa
// ser via API HTTP do Resend. Ethereal (SMTP) só é usado em dev local, onde
// essa porta não é bloqueada.
async function enviarViaResend({ para, assunto, html }) {
  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.emailFrom, to: para, subject: assunto, html }),
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error(`Falha ao enviar e-mail via Resend (${resposta.status}): ${erro}`);
  }

  console.log(`[email] "${assunto}" enviado para ${para} via Resend`);
}

let transportadorEtherealPromise;

async function obterTransportadorEthereal() {
  if (!transportadorEtherealPromise) {
    transportadorEtherealPromise = nodemailer.createTestAccount().then((conta) =>
      nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: conta.user, pass: conta.pass },
      })
    );
  }
  return transportadorEtherealPromise;
}

async function enviarViaEthereal({ para, assunto, html }) {
  const transportador = await obterTransportadorEthereal();
  const info = await transportador.sendMail({ from: env.emailFrom, to: para, subject: assunto, html });
  console.log(`[email] "${assunto}" para ${para} — preview: ${nodemailer.getTestMessageUrl(info)}`);
}

async function enviarEmail({ para, assunto, html }) {
  if (env.resendApiKey) {
    await enviarViaResend({ para, assunto, html });
  } else {
    await enviarViaEthereal({ para, assunto, html });
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
