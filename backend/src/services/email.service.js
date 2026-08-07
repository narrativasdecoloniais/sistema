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

async function enviarEmailConviteOrganizador(usuario, token) {
  const link = `${env.frontendUrl}/definir-senha?token=${token}`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Convite para organizar o Narrativas",
    html: `<p>Olá, ${usuario.nome}.</p><p>Você foi convidado(a) para organizar o Narrativas. Clique no link abaixo para definir sua senha e acessar o painel administrativo:</p><p><a href="${link}">${link}</a></p><p>Se você não esperava este convite, ignore este e-mail.</p>`,
  });
}

async function enviarEmailNotificacaoOrganizador(usuario) {
  const link = `${env.frontendUrl}/admin`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Você agora é organizador(a) do Narrativas",
    html: `<p>Olá, ${usuario.nome}.</p><p>Você foi adicionado(a) como organizador(a) do Narrativas. Acesse o painel administrativo com sua conta:</p><p><a href="${link}">${link}</a></p>`,
  });
}

async function enviarEmailPromocaoAdmin(usuario) {
  const link = `${env.frontendUrl}/admin`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Você agora é administrador(a) do Narrativas",
    html: `<p>Olá, ${usuario.nome}.</p><p>Você foi promovido(a) a administrador(a) do Narrativas e agora tem acesso total ao painel administrativo, incluindo a gestão de organizadores.</p><p><a href="${link}">${link}</a></p>`,
  });
}

// Paleta pública (DESIGN.md) em hex fixo — CSS custom properties não
// funcionam de forma confiável em clientes de e-mail, então os tokens são
// hardcoded aqui só pra esse template.
const CORES_EMAIL = {
  tinta: "#201914",
  barro: "#9c4a2f",
  ocre: "#b87c34",
  papel: "#faf6ee",
  areia: "#ede4d4",
  buzio: "#edb153",
};

function formatarPeriodoAtividade(inicio, fim) {
  const formatador = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
  return `${formatador.format(new Date(inicio))} até ${formatador.format(new Date(fim))}`;
}

function listaAtividadesHtml(inscricoes, { vazio }) {
  if (inscricoes.length === 0) return `<p style="margin: 0; color: ${CORES_EMAIL.tinta};">${vazio}</p>`;

  const itens = inscricoes
    .map(
      (inscricao) => `
        <li style="margin: 0 0 10px; color: ${CORES_EMAIL.tinta};">
          <strong>${inscricao.atividade.nome}</strong><br />
          <span style="font-size: 14px;">${formatarPeriodoAtividade(inscricao.atividade.inicioAtividade, inscricao.atividade.fimAtividade)}</span>
        </li>`
    )
    .join("");

  return `<ul style="margin: 0; padding-left: 20px;">${itens}</ul>`;
}

async function enviarEmailConfirmacaoInscricao(usuario, { edicao, confirmadas, listaEspera }) {
  const html = `
    <div style="background: ${CORES_EMAIL.papel}; padding: 32px 16px;">
      <div style="max-width: 600px; margin: 0 auto; background: ${CORES_EMAIL.areia}; border-top: 4px solid ${CORES_EMAIL.buzio}; padding: 32px;">
        <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${CORES_EMAIL.barro};">Comprovante de inscrição</p>
        <h1 style="margin: 0 0 20px; font-size: 22px; color: ${CORES_EMAIL.tinta};">${edicao.nome}</h1>

        <p style="margin: 0 0 20px; color: ${CORES_EMAIL.tinta};">
          Olá, ${usuario.nome}. Sua inscrição no evento está confirmada.
        </p>

        <p style="margin: 24px 0 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${CORES_EMAIL.barro};">Atividades confirmadas</p>
        ${listaAtividadesHtml(confirmadas, { vazio: "Nenhuma atividade específica selecionada." })}

        ${
          listaEspera.length > 0
            ? `
        <p style="margin: 24px 0 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${CORES_EMAIL.ocre};">Lista de espera</p>
        <p style="margin: 0 0 8px; color: ${CORES_EMAIL.tinta}; font-size: 14px;">
          As atividades abaixo estão com vagas esgotadas — você não está confirmado(a) nelas, mas poderá ser chamado(a) conforme surgirem vagas.
        </p>
        ${listaAtividadesHtml(listaEspera, { vazio: "" })}
        `
            : ""
        }

        <p style="margin: 28px 0 0; font-size: 13px; color: ${CORES_EMAIL.tinta};">
          Alterações na sua inscrição — como se inscrever em outras atividades ou cancelar — poderão ser feitas futuramente fazendo login no sistema.
        </p>
        <p style="margin: 20px 0 0; font-size: 12px; color: ${CORES_EMAIL.tinta};">
          Se você não fez essa inscrição, ignore este e-mail.
        </p>
      </div>
    </div>
  `;

  await enviarEmail({
    para: usuario.email,
    assunto: `Comprovante de inscrição — ${edicao.nome}`,
    html,
  });
}

module.exports = {
  enviarEmailConfirmacao,
  enviarEmailRecuperacaoSenha,
  enviarEmailConviteOrganizador,
  enviarEmailNotificacaoOrganizador,
  enviarEmailPromocaoAdmin,
  enviarEmailConfirmacaoInscricao,
};
