const nodemailer = require("nodemailer");
const env = require("../config/env");
const escaparHtml = require("../utils/escaparHtml");

// Railway (e a maioria dos PaaS) bloqueia portas de SMTP (25/465/587) no
// tráfego de saída para prevenir abuso, então em produção o envio precisa
// ser via API HTTP do Resend. Ethereal (SMTP) só é usado em dev local, onde
// essa porta não é bloqueada.
// 429 = acima de 2 req/s — as filas de envio em segundo plano (resultado,
// convites de coautor, e-mails em massa) podem rodar ao mesmo tempo, então
// espera e tenta de novo antes de desistir.
const TENTATIVAS_LIMITE_TAXA = 2;
const ESPERA_LIMITE_TAXA_MS = 1000;

async function enviarViaResend({ para, assunto, html }, tentativa = 0) {
  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.emailFrom, to: para, subject: assunto, html }),
  });

  if (resposta.status === 429 && tentativa < TENTATIVAS_LIMITE_TAXA) {
    await new Promise((resolver) => setTimeout(resolver, ESPERA_LIMITE_TAXA_MS * (tentativa + 1)));
    return enviarViaResend({ para, assunto, html }, tentativa + 1);
  }

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

// Link mágico do fluxo passwordless de submissão de trabalho (sem CPF, só
// e-mail) — destino preserva a página de formulário de onde a pessoa veio
// (modalidade/área já escolhidas), ver frontend/app/(publico)/submissao/entrar.
async function enviarEmailEntrarSubmissao(usuario, token, destino) {
  const link = `${env.frontendUrl}/submissao/entrar?token=${token}&destino=${encodeURIComponent(destino)}`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Continue sua submissão — Narrativas",
    html: `<p>Olá, ${usuario.nome}.</p><p>Clique no link abaixo para continuar sua submissão de trabalho:</p><p><a href="${link}">${link}</a></p><p>Se você não pediu isso, ignore este e-mail.</p>`,
  });
}

async function enviarEmailCodigoRegularizacao(usuario, codigo) {
  await enviarEmail({
    para: usuario.email,
    assunto: "Seu código para regularizar o cadastro — Narrativas",
    html: `<p>Olá, ${usuario.nome}.</p><p>Alguém pediu, na página "Regularizar cadastro" do Narrativas, para vincular um CPF (ou documento de estrangeiro) a este cadastro ou unificá-lo com outra conta da mesma pessoa. Digite o código abaixo na página para confirmar:</p><p style="font-size:1.6rem;font-weight:700;letter-spacing:0.2em;">${codigo}</p><p>O código vale por 30 minutos. Se não foi você, ignore este e-mail — nada será alterado.</p>`,
  });
}

async function enviarEmailCodigoTrocaEmail(usuario, novoEmail, codigo) {
  await enviarEmail({
    para: novoEmail,
    assunto: "Seu código para alterar o e-mail — Narrativas",
    html: `<p>Olá, ${usuario.nome}.</p><p>Recebemos um pedido para passar a usar este endereço na sua conta do Narrativas. Digite o código abaixo na sua área do participante para confirmar:</p><p style="font-size:1.6rem;font-weight:700;letter-spacing:0.2em;">${codigo}</p><p>O código vale por 30 minutos. Se não foi você, ignore este e-mail — nada será alterado.</p>`,
  });
}

// Aviso para o endereço antigo — se a troca não foi feita pela própria
// pessoa, é por aqui que ela fica sabendo.
async function enviarEmailAvisoTrocaEmail(usuario, emailAntigo, novoEmail) {
  await enviarEmail({
    para: emailAntigo,
    assunto: "O e-mail da sua conta foi alterado — Narrativas",
    html: `<p>Olá, ${usuario.nome}.</p><p>O e-mail da sua conta do Narrativas foi alterado para <strong>${novoEmail}</strong>. A partir de agora, use esse endereço para entrar.</p><p>Se não foi você, responda a este e-mail ou fale com a organização do evento.</p>`,
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

async function enviarEmailConviteAvaliador(usuario, token) {
  const link = `${env.frontendUrl}/definir-senha?token=${token}`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Convite para avaliar trabalhos do Narrativas",
    html: `<p>Olá, ${usuario.nome}.</p><p>Você foi convidado(a) para avaliar trabalhos submetidos ao Narrativas. Clique no link abaixo para definir sua senha; depois, os trabalhos atribuídos a você ficam em "Trabalhos para avaliar", na sua área do participante:</p><p><a href="${link}">${link}</a></p><p>Se você não esperava este convite, ignore este e-mail.</p>`,
  });
}

async function enviarEmailConviteAutor(usuario, token, titulo) {
  const link = `${env.frontendUrl}/definir-senha?token=${token}`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Seu trabalho foi registrado no Narrativas",
    html: `<p>Olá, ${escaparHtml(usuario.nome)}.</p><p>A organização do Narrativas registrou o trabalho <strong>${escaparHtml(titulo)}</strong> em seu nome e criou uma conta para você. Clique no link abaixo para definir sua senha e completar o cadastro; depois, o trabalho fica em "Minhas submissões", na sua área do participante:</p><p><a href="${link}">${link}</a></p><p>Se você não reconhece este trabalho, responda a este e-mail ou fale com a organização do evento.</p>`,
  });
}

// Convite para coautor sem conta (convitesCoautor.service.js). O mesmo link
// serve para criar a conta com este e-mail ou, para quem já tem conta com
// outro e-mail, vincular os trabalhos a ela ("Já tenho conta").
async function enviarEmailConviteCoautor({ email, nome, titulos, token }) {
  const link = `${env.frontendUrl}/cadastro?convite=${token}`;
  const listaTitulos = titulos.map((titulo) => `<li>${escaparHtml(titulo)}</li>`).join("");
  const plural = titulos.length > 1;
  await enviarEmail({
    para: email,
    assunto: "Você consta como coautor(a) no Narrativas",
    html: `<p>Olá, ${escaparHtml(nome)}.</p><p>Você consta como coautor(a) ${plural ? "dos trabalhos" : "do trabalho"} abaixo, ${plural ? "submetidos" : "submetido"} ao Narrativas:</p><ul>${listaTitulos}</ul><p>Crie sua conta pelo link abaixo — o cadastro já vem com este e-mail e ${plural ? "os trabalhos ficam" : "o trabalho fica"} em "Minhas submissões", na sua área do participante:</p><p><a href="${link}">${link}</a></p><p>Se você já tem conta no Narrativas com outro e-mail, abra o mesmo link e escolha "Já tenho conta" para vincular ${plural ? "os trabalhos" : "o trabalho"} a ela.</p><p>Se você não reconhece ${plural ? "esses trabalhos" : "esse trabalho"}, ignore este e-mail.</p>`,
  });
}

async function enviarEmailNotificacaoAvaliador(usuario) {
  const link = `${env.frontendUrl}/participante/avaliacoes`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Você agora é avaliador(a) de trabalhos do Narrativas",
    html: `<p>Olá, ${usuario.nome}.</p><p>Você foi adicionado(a) como avaliador(a) de trabalhos submetidos ao Narrativas. Entre com sua conta para ver os trabalhos atribuídos a você:</p><p><a href="${link}">${link}</a></p>`,
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

// Moldura com a paleta pública usada pelos e-mails "de evento" (comprovante
// de inscrição, resultado de submissão). corpoHtml entra como está — quem
// chama é responsável por escapar/sanitizar o conteúdo.
function layoutEmailPublico({ eyebrow, titulo, corpoHtml }) {
  return `
    <div style="background: ${CORES_EMAIL.papel}; padding: 32px 16px;">
      <div style="max-width: 600px; margin: 0 auto; background: ${CORES_EMAIL.areia}; border-top: 4px solid ${CORES_EMAIL.buzio}; padding: 32px; color: ${CORES_EMAIL.tinta};">
        <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${CORES_EMAIL.barro};">${eyebrow}</p>
        <h1 style="margin: 0 0 20px; font-size: 22px; color: ${CORES_EMAIL.tinta};">${titulo}</h1>
        ${corpoHtml}
      </div>
    </div>
  `;
}

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

async function enviarEmailConfirmacaoInscricao(
  usuario,
  { edicao, confirmadas, listaEspera, jaEstavaInscrito = false }
) {
  const eyebrow = jaEstavaInscrito ? "Atividades adicionadas" : "Comprovante de inscrição";
  const introducao = jaEstavaInscrito
    ? `Olá, ${usuario.nome}. Você adicionou novas atividades à sua inscrição no evento.`
    : `Olá, ${usuario.nome}. Sua inscrição no evento está confirmada.`;

  const corpoHtml = `
        <p style="margin: 0 0 20px; color: ${CORES_EMAIL.tinta};">
          ${introducao}
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
  `;
  const html = layoutEmailPublico({ eyebrow, titulo: edicao.nome, corpoHtml });

  await enviarEmail({
    para: usuario.email,
    assunto: `${eyebrow} — ${edicao.nome}`,
    html,
  });
}

async function enviarEmailCorrecaoDevolvida(usuario, { edicao, titulo, motivo, prazo }) {
  const link = `${env.frontendUrl}/participante/submissoes`;
  const corpoHtml = `
    <p style="margin: 0 0 16px;">Olá, ${escaparHtml(usuario.nome)}.</p>
    <p style="margin: 0 0 16px;">A organização conferiu a correção do trabalho <strong>${escaparHtml(titulo)}</strong> e pediu novos ajustes:</p>
    <p style="margin: 0 0 16px; padding: 12px 16px; background: ${CORES_EMAIL.papel};">${escaparHtml(motivo)}</p>
    ${prazo ? `<p style="margin: 0 0 16px;">Envie a nova versão até <strong>${escaparHtml(prazo)}</strong>.</p>` : ""}
    <p style="margin: 0;"><a href="${link}" style="color: ${CORES_EMAIL.barro};">Acessar minhas submissões</a></p>
  `;
  await enviarEmail({
    para: usuario.email,
    assunto: `Correção devolvida — ${edicao.nome}`,
    html: layoutEmailPublico({ eyebrow: "Resultado da submissão", titulo: edicao.nome, corpoHtml }),
  });
}

// Aviso de onde/quando o trabalho será apresentado (apresentacaoSubmissoes.service.js).
async function enviarEmailApresentacao(autor, { edicao, trabalho, atividade, ordem }) {
  // Rota por edição quando ela tem slug (funciona também para edições
  // passadas); senão, a rota da edição atual.
  const link = edicao.slug
    ? `${env.frontendUrl}/edicoes/${edicao.slug}/atividades/${atividade.slug}`
    : `${env.frontendUrl}/atividades/${atividade.slug}`;
  const corpoHtml = `
    <p style="margin: 0 0 16px;">Olá, ${escaparHtml(autor.nome)}.</p>
    <p style="margin: 0 0 16px;">O trabalho <strong>${escaparHtml(trabalho.titulo)}</strong> será apresentado na atividade:</p>
    <p style="margin: 0 0 4px; font-size: 18px; font-weight: 700;">${escaparHtml(atividade.nome)}</p>
    <p style="margin: 0 0 4px;">${escaparHtml(formatarPeriodoAtividade(atividade.inicioAtividade, atividade.fimAtividade))}</p>
    ${atividade.local ? `<p style="margin: 0 0 4px;">Local: ${escaparHtml(atividade.local)}</p>` : ""}
    ${ordem ? `<p style="margin: 0 0 16px;">Ordem de apresentação: <strong>${ordem}º</strong></p>` : ""}
    <p style="margin: 16px 0 0;"><a href="${link}" style="color: ${CORES_EMAIL.barro};">Ver a atividade e os trabalhos apresentados</a></p>
    <p style="margin: 20px 0 0; font-size: 13px;">Essas informações também ficam em Minhas submissões, na sua área do participante.</p>
  `;
  await enviarEmail({
    para: autor.email,
    assunto: `Apresentação do seu trabalho — ${edicao.nome}`,
    html: layoutEmailPublico({ eyebrow: "Apresentação de trabalho", titulo: escaparHtml(edicao.nome), corpoHtml }),
  });
}

// Novo comentário num trabalho publicado nos Anais (anais.service.js) — vai
// para cada autor/coautor, menos quem comentou.
async function enviarEmailNovoComentarioAnais(autor, { edicao, titulo, comentario, link }) {
  const texto = escaparHtml(comentario.texto).replace(/\n/g, "<br />");
  const corpoHtml = `
    <p style="margin: 0 0 16px;">Olá, ${escaparHtml(autor.nome)}.</p>
    <p style="margin: 0 0 16px;"><strong>${escaparHtml(comentario.nome)}</strong> comentou o trabalho <strong>${escaparHtml(titulo)}</strong>, publicado nos Anais:</p>
    <p style="margin: 0 0 16px; padding: 12px 16px; background: ${CORES_EMAIL.papel};">${texto}</p>
    <p style="margin: 0;"><a href="${link}" style="color: ${CORES_EMAIL.barro};">Ver o comentário e responder</a></p>
    <p style="margin: 20px 0 0; font-size: 12px;">Para responder, entre com a sua conta no site do evento.</p>
  `;
  await enviarEmail({
    para: autor.email,
    assunto: `Novo comentário no seu trabalho — ${edicao.nome}`,
    html: layoutEmailPublico({ eyebrow: "Anais", titulo: escaparHtml(edicao.nome), corpoHtml }),
  });
}

module.exports = {
  enviarEmailNovoComentarioAnais,
  enviarEmailApresentacao,
  enviarEmailConfirmacao,
  enviarEmailRecuperacaoSenha,
  enviarEmailEntrarSubmissao,
  enviarEmailCodigoTrocaEmail,
  enviarEmailAvisoTrocaEmail,
  enviarEmailCodigoRegularizacao,
  enviarEmailConviteOrganizador,
  enviarEmailNotificacaoOrganizador,
  enviarEmailConviteAvaliador,
  enviarEmailConviteAutor,
  enviarEmailConviteCoautor,
  enviarEmailNotificacaoAvaliador,
  enviarEmailPromocaoAdmin,
  enviarEmailConfirmacaoInscricao,
  enviarEmailCorrecaoDevolvida,
  enviarEmail,
  layoutEmailPublico,
};
