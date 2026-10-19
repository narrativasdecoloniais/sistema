#!/usr/bin/env node
// Dá aos avaliadores/coordenadores dos Conversatórios e das Narrativas
// Multimodais (V edição) acesso às seis seções de Submissões do admin, como
// ORGANIZADOR com permissão por seção — o mesmo que "Convidar" na aba Equipe
// de Participantes faria, pessoa por pessoa:
// - sem conta: cria a conta de convidado e manda o convite de organizador
//   (definir senha);
// - conta comum: ganha o papel ORGANIZADOR com as seções e recebe o aviso;
// - já organizador: soma as seções às que já tinha, sem e-mail;
// - admin ou organizador com acesso completo: nada a fazer.
//
// Por padrão só simula e lista o que faria. Para gravar e enviar os e-mails:
//   node src/scripts/concederAcessoSubmissoes.js            (simulação)
//   node src/scripts/concederAcessoSubmissoes.js --aplicar  (grava)
//   RESEND_API_KEY=... FRONTEND_URL=https://... \
//     node src/scripts/concederAcessoSubmissoes.js --reenviar
//     (só reenvia os e-mails — ver reenviarEmails)
// Sem RESEND_API_KEY no ambiente os e-mails vão para o Ethereal, não para as
// pessoas, e com o FRONTEND_URL local os links apontam para localhost. Idempotente: rodar de novo não duplica nada nem reenvia e-mail a quem já
// é organizador com as seções.

const env = require("../config/env");
const prisma = require("../config/prisma");
const usuariosService = require("../services/usuarios.service");
const tokenService = require("../services/token.service");
const emailService = require("../services/email.service");

const SECOES_SUBMISSOES = [
  "SUBMISSOES_MODALIDADES",
  "SUBMISSOES_RECEBIMENTO",
  "SUBMISSOES_AVALIACAO",
  "SUBMISSOES_RESULTADO",
  "SUBMISSOES_APRESENTACAO",
  "SUBMISSOES_PUBLICACAO",
];

// Intervalo entre e-mails por causa do limite de envio do Resend.
const INTERVALO_EMAIL_MS = 600;

const PESSOAS = [
  // Conversatório 1
  { nome: "Lauriene Seraguza", email: "laurieneolegario@ufgd.edu.br" },
  { nome: "Izaque João", email: "izaquejoao@gmail.com" },
  { nome: "Paulo Henrique de Felipe", email: "paulohdefelipe@gmail.com" },
  // Conversatório 2
  { nome: "Mariana Bracks", email: "marianabracks@academico.ufs.br" },
  { nome: "Jeidma Marinho", email: "jeidma@gmail.com" },
  { nome: "Rosimária de Jesus Ribeiro", email: "mariabonita.ba@gmail.com" },
  { nome: "Vinícius Ximenes Muricy da Rocha", email: "viniciuscalango@gmail.com" },
  // Conversatório 3
  { nome: "Tainá Dias de Moraes Barreto", email: "tainadmb@gmail.com" },
  { nome: "Ivana Delfino Motta", email: "ivana.motta@academico.ufs.br" },
  // Conversatório 4
  { nome: "Grazielle de Assunção Azevedo Carneiro", email: "grazielle.azevedo@fase.org.br" },
  { nome: "Sabrina Stein", email: "sabrinastein03@gmail.com" },
  // Conversatório 5
  { nome: "Edson Antoni", email: "professor.antoni@gmail.com" },
  { nome: "Ana Tereza Reis da Silva", email: "tapajuara@gmail.com" },
  { nome: "Ana Catarina Zema", email: "ana.zema@gmail.com" },
  { nome: "Alessandro Roberto de Oliveira", email: "alessandrooliveira@unb.br" },
  // Conversatório 6
  { nome: "Débora Vieira", email: "deborasalesvieira19@gmail.com" },
  { nome: "Fátima Vidal", email: "vidalrodrigues@unb.br" },
  { nome: "Aline Seabra de Oliveira", email: "alineseabra81@gmail.com" },
  // Conversatório 7
  { nome: "Carolina Mendes", email: "carolinasmendes@gmail.com" },
  { nome: "Bárbara Ribeiro Dourado Pias de Almeida", email: "barbara.unbfe@gmail.com" },
  // Conversatório 8
  { nome: "Atauan Soares de Queiroz", email: "atauansoares@gmail.com" },
  { nome: "Lucas Ferreiras dos Santos", email: "lucas.mat2318@gmail.com" },
  // Conversatório 9
  { nome: "John Cleber Sarmento Santiago", email: "johnclebersarmento@gmail.com" },
  { nome: "Romero Almeida", email: "romeroalmeida1991@gmail.com" },
  { nome: "Fabiana Ana da Silva", email: "fabianavencezlau@gmail.com" },
  // Conversatório 10
  { nome: "Jeane Maria da Silva Xavier", email: "jeaniesilvax@gmail.com" },
  { nome: "Brenda Gonçalves dos Reis", email: "prof.brenda.unb@gmail.com" },
  { nome: "Roseane Cristiane Correia Lima dos Reis", email: "cristianeagora@gmail.com" },
  // Conversatório 11
  { nome: "Andréa Brasil Teixeira", email: "andreabtm2015@gmail.com" },
  { nome: "Larissa da Silva Araujo", email: "laraofemelu@gmail.com" },
  // Conversatório 12
  { nome: "Ramon de Oliveira Santana", email: "ramon.santana@ueap.edu.br" },
  { nome: "Leiliane da Costa Ferreira", email: "leiliane.ferreira@ueap.edu.br" },
  // Conversatório 13
  { nome: "Rosi Lima", email: "rosirenelima1959@gmail.com" },
  { nome: "Alex Fiuza", email: "exfiuza@gmail.com" },
  // Conversatório 14
  { nome: "Raoni Machado Moraes Jardim", email: "raoni.mmj@gmail.com" },
  { nome: "Bruno Goulart", email: "brunogoulart@unilab.edu.br" },
  // Conversatório 15
  { nome: "Marcela Amaral", email: "marcela.amaral@ufg.br" },
  { nome: "Paulo Brito do Prado", email: "paulo.prado@ufpi.edu.br" },
  // Narrativas Multimodais
  { nome: "Patrícia Marques", email: "patricia.bmarques77@gmail.com" },
  { nome: "Luan Gomes", email: "luan.gomes@professor.ufcg.edu.br" },
];

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Decide o que fazer com cada pessoa sem gravar nada.
function planejar(usuario) {
  if (!usuario) return { acao: "CONVIDAR" };
  if (!usuario.ativo) return { acao: "INATIVA" };
  if (usuario.papeis.includes("ADMIN")) return { acao: "JA_TEM", motivo: "administrador(a)" };

  if (usuario.papeis.includes("ORGANIZADOR")) {
    if (usuario.acessoCompleto) return { acao: "JA_TEM", motivo: "organizador(a) com acesso completo" };
    const faltando = SECOES_SUBMISSOES.filter((secao) => !usuario.secoesPermitidas.includes(secao));
    if (faltando.length === 0) return { acao: "JA_TEM", motivo: "já tem as seções" };
    return { acao: "SOMAR_SECOES", faltando };
  }

  return { acao: "PROMOVER" };
}

async function aplicar(pessoa, usuario, plano) {
  if (plano.acao === "CONVIDAR") {
    const novo = await usuariosService.criarUsuarioConvidado({
      nome: pessoa.nome,
      email: pessoa.email,
      secoesPermitidas: SECOES_SUBMISSOES,
    });
    const token = await tokenService.criarTokenConviteOrganizador(novo.id);
    await emailService.enviarEmailConviteOrganizador(novo, token);
    return true;
  }

  if (plano.acao === "PROMOVER") {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        papeis: { push: "ORGANIZADOR" },
        acessoCompleto: false,
        secoesPermitidas: Array.from(new Set([...usuario.secoesPermitidas, ...SECOES_SUBMISSOES])),
      },
    });
    await emailService.enviarEmailNotificacaoOrganizador(usuario);
    return true;
  }

  if (plano.acao === "SOMAR_SECOES") {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { secoesPermitidas: [...usuario.secoesPermitidas, ...plano.faltando] },
    });
  }

  return false;
}

const DESCRICAO = {
  CONVIDAR: "sem conta → criar conta e enviar convite",
  PROMOVER: "conta existente → virar organizador(a) e avisar",
  SOMAR_SECOES: "já organizador(a) → somar seções",
  JA_TEM: "nada a fazer",
  INATIVA: "conta inativa → pulada (verificar à mão)",
};

// Reenvia só os e-mails, sem gravar permissões — para quando o --aplicar rodou
// sem RESEND_API_KEY e os envios caíram no Ethereal. Quem ainda tem convite de
// organizador válido e não usado recebe o convite de novo (mesmo token); os
// demais organizadores da lista recebem o aviso. Admins e acesso completo não.
async function reenviarEmails() {
  if (!env.resendApiKey) {
    console.error("RESEND_API_KEY vazia: os e-mails iriam para o Ethereal. Passe a chave no ambiente.");
    process.exitCode = 1;
    return;
  }
  if (env.frontendUrl.includes("localhost")) {
    console.error(`FRONTEND_URL é ${env.frontendUrl}: os links do e-mail não abririam. Passe a URL do site.`);
    process.exitCode = 1;
    return;
  }
  console.log("Modo: REENVIAR e-mails (não grava permissões)\n");
  let enviados = 0;
  const falhas = [];

  for (const pessoa of PESSOAS) {
    const usuario = await usuariosService.buscarPorEmail(pessoa.email);
    if (!usuario || !usuario.ativo || !usuario.papeis.includes("ORGANIZADOR")) continue;
    if (usuario.papeis.includes("ADMIN") || usuario.acessoCompleto) continue;

    const convite = await prisma.tokenVerificacao.findFirst({
      where: {
        usuarioId: usuario.id,
        tipo: "CONVITE_ORGANIZADOR",
        usadoEm: null,
        expiraEm: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    try {
      if (convite) {
        await emailService.enviarEmailConviteOrganizador(usuario, convite.token);
      } else {
        await emailService.enviarEmailNotificacaoOrganizador(usuario);
      }
      enviados += 1;
      console.log(`${pessoa.nome} <${usuario.email}>: ${convite ? "convite" : "aviso"} reenviado`);
    } catch (erro) {
      falhas.push(pessoa);
      console.error(`${pessoa.nome} <${usuario.email}>: ✗ falhou: ${erro.message}`);
    }
    await esperar(INTERVALO_EMAIL_MS);
  }

  console.log(`\n${enviados} e-mail(s) enviado(s), ${falhas.length} falha(s).`);
  if (falhas.length > 0) process.exitCode = 1;
}

async function main() {
  if (process.argv.includes("--reenviar")) return reenviarEmails();

  const gravar = process.argv.includes("--aplicar");
  console.log(gravar ? "Modo: APLICAR (grava e envia e-mails)\n" : "Modo: simulação (nada é gravado)\n");

  const contagem = {};
  const falhas = [];

  for (const pessoa of PESSOAS) {
    const usuario = await usuariosService.buscarPorEmail(pessoa.email);
    const plano = planejar(usuario);
    contagem[plano.acao] = (contagem[plano.acao] || 0) + 1;

    const detalhe = plano.motivo || (plano.faltando ? plano.faltando.join(", ") : "");
    const contaInfo = usuario && usuario.email !== pessoa.email ? ` [conta: ${usuario.email}]` : "";
    console.log(
      `${pessoa.nome} <${pessoa.email}>${contaInfo}: ${DESCRICAO[plano.acao]}${detalhe ? ` (${detalhe})` : ""}`,
    );

    if (!gravar) continue;

    try {
      const enviouEmail = await aplicar(pessoa, usuario, plano);
      if (enviouEmail) await esperar(INTERVALO_EMAIL_MS);
    } catch (erro) {
      falhas.push({ pessoa, erro });
      console.error(`  ✗ falhou: ${erro.message}`);
    }
  }

  console.log("\nResumo:");
  for (const [acao, total] of Object.entries(contagem)) {
    console.log(`  ${DESCRICAO[acao]}: ${total}`);
  }

  if (falhas.length > 0) {
    console.log(`\n${falhas.length} falha(s). Se a conta chegou a ser criada mas o e-mail não saiu,`);
    console.log("remova a pessoa em Participantes › Equipe e convide de novo pela tela.");
    process.exitCode = 1;
  }

  if (!gravar) console.log("\nNada foi gravado. Rode com --aplicar para efetivar.");
}

main()
  .catch((erro) => {
    console.error("Erro ao conceder acesso:", erro.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
