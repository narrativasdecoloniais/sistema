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

// ---------------------------------------------------------------------------
// Layout único de todos os e-mails (automáticos, modelos de resultado e
// e-mails em massa).
// ---------------------------------------------------------------------------

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

const FONTE_EMAIL = "Archivo, Arial, Helvetica, sans-serif";
const NOME_EVENTO = "Narrativas Interculturais, Decoloniais e Antirracistas em Educação";

// Estilo padrão das tags que o texto livre pode trazer (corpo dos modelos
// de e-mail, já sanitizado e sem atributo style). Só entra em tag que ainda
// não tem style — os templates fixos abaixo continuam mandando no próprio
// visual quando precisam.
const ESTILOS_PADRAO = {
  p: "margin: 0 0 16px; font-size: 15px; line-height: 1.6;",
  ul: "margin: 0 0 16px; padding-left: 22px; font-size: 15px; line-height: 1.6;",
  ol: "margin: 0 0 16px; padding-left: 22px; font-size: 15px; line-height: 1.6;",
  li: "margin: 0 0 6px;",
  a: `color: ${CORES_EMAIL.barro}; text-decoration: underline;`,
  h2: "margin: 24px 0 12px; font-size: 18px; line-height: 1.3;",
  h3: "margin: 20px 0 10px; font-size: 16px; line-height: 1.3;",
  table: "border-collapse: collapse; margin: 0 0 16px; font-size: 14px;",
  th: `border: 1px solid ${CORES_EMAIL.tinta}; padding: 6px 10px; text-align: left;`,
  td: `border: 1px solid ${CORES_EMAIL.tinta}; padding: 6px 10px; vertical-align: top;`,
  img: "max-width: 100%; height: auto;",
};

function aplicarEstilosPadrao(html) {
  return html.replace(/<(p|ul|ol|li|a|h2|h3|table|th|td|img)(\s[^>]*)?>/gi, (tag, nome, atributos = "") => {
    if (/\sstyle\s*=/i.test(atributos)) return tag;
    const autoFechada = atributos.trimEnd().endsWith("/");
    const resto = autoFechada ? atributos.trimEnd().slice(0, -1) : atributos;
    return `<${nome}${resto} style="${ESTILOS_PADRAO[nome.toLowerCase()]}"${autoFechada ? " /" : ""}>`;
  });
}

// Botão de ação principal. Tabela com bgcolor porque o Outlook ignora
// padding/background em <a>; o link por extenso embaixo cobre quem tem o
// botão bloqueado ou recebe só texto.
function botaoEmail(link, rotulo) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 8px 0 12px;">
      <tr>
        <td bgcolor="${CORES_EMAIL.barro}" style="background: ${CORES_EMAIL.barro};">
          <a href="${link}" style="display: inline-block; padding: 12px 22px; font-family: ${FONTE_EMAIL}; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none;">${rotulo}</a>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 16px; font-size: 12px; line-height: 1.5; word-break: break-all;">Se o botão não funcionar, copie e cole este endereço no navegador:<br /><a href="${link}" style="color: ${CORES_EMAIL.barro};">${link}</a></p>
  `;
}

function codigoEmail(codigo) {
  return `<p style="margin: 8px 0 20px; padding: 14px 18px; background: ${CORES_EMAIL.papel}; font-size: 26px; font-weight: 700; letter-spacing: 0.2em; text-align: center;">${codigo}</p>`;
}

function destaqueEmail(conteudoHtml) {
  return `<p style="margin: 0 0 16px; padding: 12px 16px; background: ${CORES_EMAIL.papel}; font-size: 15px; line-height: 1.6;">${conteudoHtml}</p>`;
}

function avisoFinalEmail(texto) {
  return `<p style="margin: 24px 0 0; font-size: 12px; line-height: 1.5; opacity: 0.8;">${texto}</p>`;
}

// Moldura com a paleta pública, usada por todos os e-mails. eyebrow, titulo
// e corpoHtml entram como estão — quem chama é responsável por
// escapar/sanitizar o conteúdo. Tags do corpo sem style recebem o visual
// padrão (aplicarEstilosPadrao), o que cobre o texto livre dos modelos.
function layoutEmailPublico({ eyebrow, titulo, corpoHtml }) {
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin: 0; padding: 0; background: ${CORES_EMAIL.papel};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CORES_EMAIL.papel}" style="background: ${CORES_EMAIL.papel};">
    <tr>
      <td align="center" style="padding: 32px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; font-family: ${FONTE_EMAIL}; color: ${CORES_EMAIL.tinta};">
          <tr>
            <td style="padding: 0 4px 12px; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${CORES_EMAIL.tinta};">Narrativas</td>
          </tr>
          <tr>
            <td bgcolor="${CORES_EMAIL.areia}" style="background: ${CORES_EMAIL.areia}; border-top: 4px solid ${CORES_EMAIL.buzio}; padding: 32px 28px; color: ${CORES_EMAIL.tinta};">
              <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${CORES_EMAIL.barro};">${eyebrow}</p>
              <h1 style="margin: 0 0 20px; font-size: 22px; line-height: 1.3; color: ${CORES_EMAIL.tinta};">${titulo}</h1>
              ${aplicarEstilosPadrao(corpoHtml)}
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 4px 0; font-size: 12px; line-height: 1.5; color: ${CORES_EMAIL.tinta}; opacity: 0.75;">
              ${NOME_EVENTO} · GPDES/UnB<br />
              <a href="${env.frontendUrl}" style="color: ${CORES_EMAIL.barro};">${env.frontendUrl.replace(/^https?:\/\//, "")}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ola(nome) {
  return `<p>Olá, ${escaparHtml(nome)}.</p>`;
}

// ---------------------------------------------------------------------------
// Conta e acesso
// ---------------------------------------------------------------------------

async function enviarEmailConfirmacao(usuario, token) {
  const link = `${env.frontendUrl}/confirmar-email?token=${token}`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Confirme seu e-mail — Narrativas",
    html: layoutEmailPublico({
      eyebrow: "Cadastro",
      titulo: "Confirme seu e-mail",
      corpoHtml: `${ola(usuario.nome)}<p>Confirme seu cadastro no Narrativas pelo botão abaixo:</p>${botaoEmail(link, "Confirmar e-mail")}${avisoFinalEmail("Se você não fez esse cadastro, ignore este e-mail.")}`,
    }),
  });
}

async function enviarEmailRecuperacaoSenha(usuario, token) {
  const link = `${env.frontendUrl}/redefinir-senha?token=${token}`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Recuperação de senha — Narrativas",
    html: layoutEmailPublico({
      eyebrow: "Acesso à conta",
      titulo: "Redefinir senha",
      corpoHtml: `${ola(usuario.nome)}<p>Recebemos um pedido para redefinir sua senha. Use o botão abaixo para escolher uma nova senha:</p>${botaoEmail(link, "Escolher nova senha")}${avisoFinalEmail("Se você não pediu isso, ignore este e-mail.")}`,
    }),
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
    html: layoutEmailPublico({
      eyebrow: "Submissão de trabalho",
      titulo: "Continue sua submissão",
      corpoHtml: `${ola(usuario.nome)}<p>Use o botão abaixo para continuar sua submissão de trabalho:</p>${botaoEmail(link, "Continuar submissão")}${avisoFinalEmail("Se você não pediu isso, ignore este e-mail.")}`,
    }),
  });
}

async function enviarEmailCodigoRegularizacao(usuario, codigo) {
  await enviarEmail({
    para: usuario.email,
    assunto: "Seu código para regularizar o cadastro — Narrativas",
    html: layoutEmailPublico({
      eyebrow: "Regularização de cadastro",
      titulo: "Seu código de confirmação",
      corpoHtml: `${ola(usuario.nome)}<p>Alguém pediu, na página "Regularizar cadastro" do Narrativas, para vincular um CPF (ou documento de estrangeiro) a este cadastro ou unificá-lo com outra conta da mesma pessoa. Digite o código abaixo na página para confirmar:</p>${codigoEmail(codigo)}<p>O código vale por 30 minutos.</p>${avisoFinalEmail("Se não foi você, ignore este e-mail — nada será alterado.")}`,
    }),
  });
}

async function enviarEmailCodigoTrocaEmail(usuario, novoEmail, codigo) {
  await enviarEmail({
    para: novoEmail,
    assunto: "Seu código para alterar o e-mail — Narrativas",
    html: layoutEmailPublico({
      eyebrow: "Sua conta",
      titulo: "Confirme o novo e-mail",
      corpoHtml: `${ola(usuario.nome)}<p>Recebemos um pedido para passar a usar este endereço na sua conta do Narrativas. Digite o código abaixo na sua área do participante para confirmar:</p>${codigoEmail(codigo)}<p>O código vale por 30 minutos.</p>${avisoFinalEmail("Se não foi você, ignore este e-mail — nada será alterado.")}`,
    }),
  });
}

// Aviso para o endereço antigo — se a troca não foi feita pela própria
// pessoa, é por aqui que ela fica sabendo.
async function enviarEmailAvisoTrocaEmail(usuario, emailAntigo, novoEmail) {
  await enviarEmail({
    para: emailAntigo,
    assunto: "O e-mail da sua conta foi alterado — Narrativas",
    html: layoutEmailPublico({
      eyebrow: "Sua conta",
      titulo: "Seu e-mail foi alterado",
      corpoHtml: `${ola(usuario.nome)}<p>O e-mail da sua conta do Narrativas foi alterado para <strong>${escaparHtml(novoEmail)}</strong>. A partir de agora, use esse endereço para entrar.</p>${avisoFinalEmail("Se não foi você, fale com a organização do evento.")}`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Papéis e convites
// ---------------------------------------------------------------------------

async function enviarEmailConviteOrganizador(usuario, token) {
  const link = `${env.frontendUrl}/definir-senha?token=${token}`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Convite para organizar o Narrativas",
    html: layoutEmailPublico({
      eyebrow: "Convite",
      titulo: "Organização do Narrativas",
      corpoHtml: `${ola(usuario.nome)}<p>Você foi convidado(a) para organizar o Narrativas. Defina sua senha pelo botão abaixo para acessar o painel administrativo:</p>${botaoEmail(link, "Definir senha")}${avisoFinalEmail("Se você não esperava este convite, ignore este e-mail.")}`,
    }),
  });
}

async function enviarEmailNotificacaoOrganizador(usuario) {
  const link = `${env.frontendUrl}/admin`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Você agora é organizador(a) do Narrativas",
    html: layoutEmailPublico({
      eyebrow: "Organização",
      titulo: "Você agora é organizador(a)",
      corpoHtml: `${ola(usuario.nome)}<p>Você foi adicionado(a) como organizador(a) do Narrativas. Acesse o painel administrativo com sua conta:</p>${botaoEmail(link, "Acessar o painel")}`,
    }),
  });
}

async function enviarEmailPromocaoAdmin(usuario) {
  const link = `${env.frontendUrl}/admin`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Você agora é administrador(a) do Narrativas",
    html: layoutEmailPublico({
      eyebrow: "Organização",
      titulo: "Você agora é administrador(a)",
      corpoHtml: `${ola(usuario.nome)}<p>Você foi promovido(a) a administrador(a) do Narrativas e agora tem acesso total ao painel administrativo, incluindo a gestão de organizadores.</p>${botaoEmail(link, "Acessar o painel")}`,
    }),
  });
}

async function enviarEmailConviteAvaliador(usuario, token) {
  const link = `${env.frontendUrl}/definir-senha?token=${token}`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Convite para avaliar trabalhos do Narrativas",
    html: layoutEmailPublico({
      eyebrow: "Convite",
      titulo: "Avaliação de trabalhos",
      corpoHtml: `${ola(usuario.nome)}<p>Você foi convidado(a) para avaliar trabalhos submetidos ao Narrativas. Defina sua senha pelo botão abaixo; depois, os trabalhos atribuídos a você ficam em "Trabalhos para avaliar", na sua área do participante:</p>${botaoEmail(link, "Definir senha")}${avisoFinalEmail("Se você não esperava este convite, ignore este e-mail.")}`,
    }),
  });
}

async function enviarEmailNotificacaoAvaliador(usuario) {
  const link = `${env.frontendUrl}/participante/avaliacoes`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Você agora é avaliador(a) de trabalhos do Narrativas",
    html: layoutEmailPublico({
      eyebrow: "Avaliação de trabalhos",
      titulo: "Você agora é avaliador(a)",
      corpoHtml: `${ola(usuario.nome)}<p>Você foi adicionado(a) como avaliador(a) de trabalhos submetidos ao Narrativas. Entre com sua conta para ver os trabalhos atribuídos a você:</p>${botaoEmail(link, "Ver trabalhos para avaliar")}`,
    }),
  });
}

async function enviarEmailConviteAutor(usuario, token, titulo) {
  const link = `${env.frontendUrl}/definir-senha?token=${token}`;
  await enviarEmail({
    para: usuario.email,
    assunto: "Seu trabalho foi registrado no Narrativas",
    html: layoutEmailPublico({
      eyebrow: "Submissão de trabalho",
      titulo: "Seu trabalho foi registrado",
      corpoHtml: `${ola(usuario.nome)}<p>A organização do Narrativas registrou o trabalho <strong>${escaparHtml(titulo)}</strong> em seu nome e criou uma conta para você. Defina sua senha pelo botão abaixo para completar o cadastro; depois, o trabalho fica em "Minhas submissões", na sua área do participante:</p>${botaoEmail(link, "Definir senha")}${avisoFinalEmail("Se você não reconhece este trabalho, fale com a organização do evento.")}`,
    }),
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
    html: layoutEmailPublico({
      eyebrow: "Coautoria",
      titulo: "Você consta como coautor(a)",
      corpoHtml: `${ola(nome)}<p>Você consta como coautor(a) ${plural ? "dos trabalhos" : "do trabalho"} abaixo, ${plural ? "submetidos" : "submetido"} ao Narrativas:</p><ul>${listaTitulos}</ul><p>Crie sua conta pelo botão abaixo — o cadastro já vem com este e-mail e ${plural ? "os trabalhos ficam" : "o trabalho fica"} em "Minhas submissões", na sua área do participante:</p>${botaoEmail(link, "Criar minha conta")}<p>Se você já tem conta no Narrativas com outro e-mail, abra o mesmo link e escolha "Já tenho conta" para vincular ${plural ? "os trabalhos" : "o trabalho"} a ela.</p>${avisoFinalEmail(`Se você não reconhece ${plural ? "esses trabalhos" : "esse trabalho"}, ignore este e-mail.`)}`,
    }),
  });
}

// ---------------------------------------------------------------------------
// Evento
// ---------------------------------------------------------------------------

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

const ROTULO_SECAO = `style="margin: 24px 0 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${CORES_EMAIL.barro};"`;

function listaAtividadesHtml(inscricoes, { vazio }) {
  if (inscricoes.length === 0) return `<p>${vazio}</p>`;

  const itens = inscricoes
    .map(
      (inscricao) => `
        <li style="margin: 0 0 10px;">
          <strong>${escaparHtml(inscricao.atividade.nome)}</strong><br />
          <span style="font-size: 14px;">${formatarPeriodoAtividade(inscricao.atividade.inicioAtividade, inscricao.atividade.fimAtividade)}</span>
        </li>`
    )
    .join("");

  return `<ul>${itens}</ul>`;
}

async function enviarEmailConfirmacaoInscricao(
  usuario,
  { edicao, confirmadas, listaEspera, jaEstavaInscrito = false }
) {
  const eyebrow = jaEstavaInscrito ? "Atividades adicionadas" : "Comprovante de inscrição";
  const introducao = jaEstavaInscrito
    ? `Olá, ${escaparHtml(usuario.nome)}. Você adicionou novas atividades à sua inscrição no evento.`
    : `Olá, ${escaparHtml(usuario.nome)}. Sua inscrição no evento está confirmada.`;

  const corpoHtml = `
    <p>${introducao}</p>

    <p ${ROTULO_SECAO}>Atividades confirmadas</p>
    ${listaAtividadesHtml(confirmadas, { vazio: "Nenhuma atividade específica selecionada." })}

    ${
      listaEspera.length > 0
        ? `
    <p ${ROTULO_SECAO.replace(CORES_EMAIL.barro, CORES_EMAIL.ocre)}>Lista de espera</p>
    <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6;">
      As atividades abaixo estão com vagas esgotadas — você não está confirmado(a) nelas, mas poderá ser chamado(a) conforme surgirem vagas.
    </p>
    ${listaAtividadesHtml(listaEspera, { vazio: "" })}
    `
        : ""
    }

    <p style="margin: 28px 0 0; font-size: 13px; line-height: 1.6;">
      Alterações na sua inscrição — como se inscrever em outras atividades ou cancelar — podem ser feitas entrando na sua área do participante.
    </p>
    ${avisoFinalEmail("Se você não fez essa inscrição, ignore este e-mail.")}
  `;
  const html = layoutEmailPublico({ eyebrow, titulo: escaparHtml(edicao.nome), corpoHtml });

  await enviarEmail({
    para: usuario.email,
    assunto: `${eyebrow} — ${edicao.nome}`,
    html,
  });
}

async function enviarEmailCorrecaoDevolvida(usuario, { edicao, titulo, motivo, prazo }) {
  const link = `${env.frontendUrl}/participante/submissoes`;
  const corpoHtml = `
    ${ola(usuario.nome)}
    <p>A organização conferiu a correção do trabalho <strong>${escaparHtml(titulo)}</strong> e pediu novos ajustes:</p>
    ${destaqueEmail(escaparHtml(motivo).replace(/\n/g, "<br />"))}
    ${prazo ? `<p>Envie a nova versão até <strong>${escaparHtml(prazo)}</strong>.</p>` : ""}
    ${botaoEmail(link, "Acessar minhas submissões")}
  `;
  await enviarEmail({
    para: usuario.email,
    assunto: `Correção devolvida — ${edicao.nome}`,
    html: layoutEmailPublico({ eyebrow: "Resultado da submissão", titulo: escaparHtml(edicao.nome), corpoHtml }),
  });
}

// Novo comentário num trabalho publicado nos Anais (anais.service.js) — vai
// para cada autor/coautor, menos quem comentou.
async function enviarEmailNovoComentarioAnais(autor, { edicao, titulo, comentario, link }) {
  const texto = escaparHtml(comentario.texto).replace(/\n/g, "<br />");
  const corpoHtml = `
    ${ola(autor.nome)}
    <p><strong>${escaparHtml(comentario.nome)}</strong> comentou o trabalho <strong>${escaparHtml(titulo)}</strong>, publicado nos Anais:</p>
    ${destaqueEmail(texto)}
    ${botaoEmail(link, "Ver o comentário e responder")}
    ${avisoFinalEmail("Para responder, entre com a sua conta no site do evento.")}
  `;
  await enviarEmail({
    para: autor.email,
    assunto: `Novo comentário no seu trabalho — ${edicao.nome}`,
    html: layoutEmailPublico({ eyebrow: "Anais", titulo: escaparHtml(edicao.nome), corpoHtml }),
  });
}

module.exports = {
  enviarEmailNovoComentarioAnais,
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
  botaoEmail,
  avisoFinalEmail,
};
