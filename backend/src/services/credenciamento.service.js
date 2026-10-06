const crypto = require("crypto");
const prisma = require("../config/prisma");
const env = require("../config/env");
const ErroHttp = require("../utils/erroHttp");
const { agoraIngenuo, hojeIngenuo } = require("../utils/horarioBrasilia");
const inscricoesService = require("./inscricoes.service");
const storageService = require("./storage.service");

// Credenciamento geral (uma vez no evento) e presença em atividades que
// exigem inscrição. Pelo QR code, o participante logado lê um token secreto
// (Edicao.tokenCredenciamento / Atividade.tokenPresenca) dentro da janela de
// horário (Brasília); a equipe (seção CREDENCIAMENTO) registra a qualquer
// momento, inclusive presença de quem está na lista de espera. Toda presença
// registrada também credencia no evento, e credenciar cria a inscrição geral
// se faltar — sem a pergunta de adaptação (fica "sem resposta") e sem olhar a
// janela de inscrições.
//
// Crachá virtual: cada pessoa tem um QR code próprio (Usuario.tokenCracha,
// prefixo "c_", o QR guarda só o token) que a equipe lê no leitor
// (/equipe/edicoes/<id>/credenciamento) para credenciar no evento ou
// registrar presença numa atividade — origem CRACHA, a qualquer hora, como
// tudo o que a equipe faz.

const MINUTOS_ANTES_DA_ATIVIDADE = 30;
const REGEX_TOKEN = /^[ea]_[A-Za-z0-9_-]{20,64}$/;
const REGEX_TOKEN_CRACHA = /^c_[A-Za-z0-9_-]{20,64}$/;
const AVISO_EQUIPE = "Sua presença deve ser validada com a equipe do evento.";
const CAMPOS_USUARIO = { id: true, nome: true, email: true, cpf: true, documentoEstrangeiro: true, pais: true };
const CAMPOS_AUTOR = { select: { id: true, nome: true } };

function gerarToken(prefixo, bytes = 24) {
  return `${prefixo}_${crypto.randomBytes(bytes).toString("base64url")}`;
}

function urlDoToken(token) {
  return `${env.frontendUrl}/participante/credenciamento/${token}`;
}

// Datas "ingênuas": componentes UTC = horário de Brasília.
function formatarDia(data) {
  const [ano, mes, dia] = new Date(data).toISOString().slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarHora(data) {
  return new Date(data).toISOString().slice(11, 16).replace(":", "h");
}

// ---------------------------------------------------------------------------
// Janelas (horário de Brasília)
// ---------------------------------------------------------------------------

function janelaEvento(edicao) {
  if (!edicao.dataInicio) {
    return { aberta: false, mensagem: "As datas do evento ainda não foram definidas." };
  }
  const hoje = hojeIngenuo();
  const inicio = new Date(edicao.dataInicio).toISOString().slice(0, 10);
  const fim = new Date(edicao.dataFim || edicao.dataInicio).toISOString().slice(0, 10);
  if (hoje < inicio) {
    return { aberta: false, mensagem: `O credenciamento pelo QR code abre no primeiro dia do evento (${formatarDia(inicio)}).` };
  }
  if (hoje > fim) {
    return { aberta: false, mensagem: `O credenciamento pelo QR code encerrou no último dia do evento (${formatarDia(fim)}).` };
  }
  return { aberta: true, mensagem: null };
}

function janelaAtividade(atividade) {
  const agora = agoraIngenuo();
  const abre = new Date(new Date(atividade.inicioAtividade).getTime() - MINUTOS_ANTES_DA_ATIVIDADE * 60 * 1000);
  const fecha = new Date(atividade.fimAtividade);
  if (agora < abre) {
    return {
      aberta: false,
      mensagem: `A presença pelo QR code abre às ${formatarHora(abre)} de ${formatarDia(abre)}, ${MINUTOS_ANTES_DA_ATIVIDADE} minutos antes do início.`,
    };
  }
  if (agora > fecha) {
    return { aberta: false, mensagem: `A presença pelo QR code encerrou às ${formatarHora(fecha)} de ${formatarDia(fecha)}, no fim da atividade.` };
  }
  return { aberta: true, mensagem: null };
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

const CAMPOS_EDICAO_QR = { id: true, nome: true, numero: true, dataInicio: true, dataFim: true };
const CAMPOS_ATIVIDADE_QR = {
  id: true,
  nome: true,
  local: true,
  inicioAtividade: true,
  fimAtividade: true,
  exigeInscricao: true,
  semLimiteVagas: true,
  vagas: true,
  edicaoId: true,
  edicao: { select: CAMPOS_EDICAO_QR },
};

async function resolverToken(token) {
  const invalido = new ErroHttp(404, "QR code inválido ou desativado. Procure a equipe do evento.");
  if (typeof token === "string" && REGEX_TOKEN_CRACHA.test(token)) {
    throw new ErroHttp(400, "Este é o crachá de um participante. Quem lê o crachá é a equipe do evento.");
  }
  if (typeof token !== "string" || !REGEX_TOKEN.test(token)) throw invalido;

  if (token.startsWith("e_")) {
    const edicao = await prisma.edicao.findUnique({ where: { tokenCredenciamento: token }, select: CAMPOS_EDICAO_QR });
    if (!edicao) throw invalido;
    return { tipo: "EVENTO", edicao };
  }

  const atividade = await prisma.atividade.findUnique({ where: { tokenPresenca: token }, select: CAMPOS_ATIVIDADE_QR });
  if (!atividade || !atividade.exigeInscricao) throw invalido;
  const { edicao, ...resto } = atividade;
  return { tipo: "ATIVIDADE", atividade: resto, edicao };
}

// ---------------------------------------------------------------------------
// Núcleo compartilhado (QR e equipe)
// ---------------------------------------------------------------------------

// Quem registrou: ninguém pelo QR do próprio participante; a pessoa da
// equipe com EQUIPE (busca no admin) e CRACHA (leitor de crachás).
function autorDoRegistro(origem, autorId) {
  return origem === "QR_CODE" ? null : autorId;
}

// Cria a inscrição geral se faltar e marca o credenciamento (só a primeira
// vez: credenciar de novo não muda quando nem por quem).
async function garantirCredenciamento(tx, usuarioId, edicaoId, { origem, autorId = null }) {
  const existente = await tx.inscricaoEdicao.findUnique({ where: { usuarioId_edicaoId: { usuarioId, edicaoId } } });
  if (existente?.credenciadoEm) return { inscricao: existente, jaEstava: true, inscritaAgora: false };

  const dados = {
    credenciadoEm: new Date(),
    credenciamentoOrigem: origem,
    credenciadoPorId: autorDoRegistro(origem, autorId),
  };
  const inscricao = existente
    ? await tx.inscricaoEdicao.update({ where: { id: existente.id }, data: dados })
    : await tx.inscricaoEdicao.create({ data: { usuarioId, edicaoId, ...dados } });
  return { inscricao, jaEstava: false, inscritaAgora: !existente };
}

function dadosPresenca(origem, autorId) {
  return {
    presencaEm: new Date(),
    presencaOrigem: origem,
    presencaRegistradaPorId: autorDoRegistro(origem, autorId),
  };
}

// Inscrições da pessoa nesta edição que conflitam em horário com a atividade.
async function conflitos(db, usuarioId, atividade) {
  const inscricoes = await db.inscricaoAtividade.findMany({
    where: { usuarioId, atividade: { edicaoId: atividade.edicaoId }, NOT: { atividadeId: atividade.id } },
    include: { atividade: { select: { id: true, nome: true, inicioAtividade: true, fimAtividade: true } } },
  });
  return inscricoes.filter((inscricao) => inscricoesService.haSobreposicao(inscricao.atividade, atividade));
}

async function temVaga(db, atividade) {
  if (atividade.semLimiteVagas) return true;
  const confirmadas = await db.inscricaoAtividade.count({ where: { atividadeId: atividade.id, status: "CONFIRMADA" } });
  return confirmadas < atividade.vagas;
}

// ---------------------------------------------------------------------------
// Participante (QR code)
// ---------------------------------------------------------------------------

function projetarAtividade(atividade) {
  return {
    id: atividade.id,
    nome: atividade.nome,
    local: atividade.local,
    inicioAtividade: atividade.inicioAtividade,
    fimAtividade: atividade.fimAtividade,
  };
}

async function previa(usuarioId, token) {
  const alvo = await resolverToken(token);
  const edicao = { id: alvo.edicao.id, nome: alvo.edicao.nome };
  const inscricaoEdicao = await prisma.inscricaoEdicao.findUnique({
    where: { usuarioId_edicaoId: { usuarioId, edicaoId: alvo.edicao.id } },
  });

  if (alvo.tipo === "EVENTO") {
    return {
      tipo: "EVENTO",
      edicao,
      janela: janelaEvento(alvo.edicao),
      credenciadoEm: inscricaoEdicao?.credenciadoEm || null,
    };
  }

  const { atividade } = alvo;
  const inscricao = await prisma.inscricaoAtividade.findUnique({
    where: { usuarioId_atividadeId: { usuarioId, atividadeId: atividade.id } },
  });
  const conflitantes = inscricao ? [] : await conflitos(prisma, usuarioId, atividade);

  return {
    tipo: "ATIVIDADE",
    edicao,
    atividade: projetarAtividade(atividade),
    janela: janelaAtividade(atividade),
    inscricao: inscricao ? { status: inscricao.status, presencaEm: inscricao.presencaEm } : null,
    conflitos: conflitantes.map((item) => ({
      ...projetarAtividade(item.atividade),
      status: item.status,
      temPresenca: Boolean(item.presencaEm),
    })),
    temVaga: inscricao ? null : await temVaga(prisma, atividade),
    aviso: inscricao?.status === "LISTA_ESPERA" && !inscricao.presencaEm ? AVISO_EQUIPE : null,
  };
}

async function credenciarEvento(usuarioId, token) {
  const alvo = await resolverToken(token);
  if (alvo.tipo !== "EVENTO") throw new ErroHttp(400, "Este QR code é de uma atividade.");
  const janela = janelaEvento(alvo.edicao);
  if (!janela.aberta) throw new ErroHttp(409, janela.mensagem);

  const { inscricao, jaEstava } = await prisma.$transaction((tx) =>
    garantirCredenciamento(tx, usuarioId, alvo.edicao.id, { origem: "QR_CODE" })
  );
  return {
    credenciadoEm: inscricao.credenciadoEm,
    mensagem: jaEstava ? "Você já estava credenciado(a) no evento." : "Credenciamento no evento registrado.",
  };
}

// `inscrever`: a pessoa confirmou que quer se inscrever (não estava inscrita).
// `trocar`: confirmou cancelar as inscrições em conflito de horário.
async function registrarPresenca(usuarioId, token, { inscrever = false, trocar = false } = {}) {
  const alvo = await resolverToken(token);
  if (alvo.tipo !== "ATIVIDADE") throw new ErroHttp(400, "Este QR code é do credenciamento geral do evento.");
  const { atividade } = alvo;
  const janela = janelaAtividade(atividade);
  if (!janela.aberta) throw new ErroHttp(409, janela.mensagem);

  return prisma.$transaction(async (tx) => {
    let inscricao = await tx.inscricaoAtividade.findUnique({
      where: { usuarioId_atividadeId: { usuarioId, atividadeId: atividade.id } },
    });
    let novaInscricao = false;

    if (!inscricao) {
      if (!inscrever) throw new ErroHttp(409, "Você não está inscrito(a) nesta atividade. Confirme a inscrição para registrar a presença.");

      const conflitantes = await conflitos(tx, usuarioId, atividade);
      if (conflitantes.length > 0) {
        if (conflitantes.some((item) => item.presencaEm)) {
          throw new ErroHttp(409, `Sua presença já foi registrada em "${conflitantes.find((item) => item.presencaEm).atividade.nome}", no mesmo horário. ${AVISO_EQUIPE}`);
        }
        if (!trocar) {
          throw new ErroHttp(409, `Você está inscrito(a) em "${conflitantes[0].atividade.nome}" no mesmo horário. Confirme a troca de atividade.`);
        }
        for (const item of conflitantes) await inscricoesService.promoverAoCancelar(tx, item.id);
      }

      const status = await inscricoesService.statusParaNovaInscricao(tx, atividade);
      inscricao = await tx.inscricaoAtividade.create({ data: { usuarioId, atividadeId: atividade.id, status } });
      novaInscricao = true;
    }

    if (inscricao.presencaEm) {
      return { status: inscricao.status, presencaEm: inscricao.presencaEm, novaInscricao, mensagem: "Sua presença nesta atividade já estava registrada." };
    }

    // Lista de espera: pelo QR não vale — a equipe valida na hora.
    if (inscricao.status !== "CONFIRMADA") {
      await garantirInscricaoGeral(tx, usuarioId, atividade.edicaoId);
      return {
        status: inscricao.status,
        presencaEm: null,
        novaInscricao,
        mensagem: novaInscricao ? `Não há mais vagas: você entrou na lista de espera. ${AVISO_EQUIPE}` : `Você está na lista de espera. ${AVISO_EQUIPE}`,
      };
    }

    const atualizada = await tx.inscricaoAtividade.update({ where: { id: inscricao.id }, data: dadosPresenca("QR_CODE") });
    await garantirCredenciamento(tx, usuarioId, atividade.edicaoId, { origem: "QR_CODE" });
    return {
      status: atualizada.status,
      presencaEm: atualizada.presencaEm,
      novaInscricao,
      mensagem: novaInscricao ? "Inscrição feita e presença registrada." : "Presença registrada.",
    };
  });
}

// Sem credenciar — quem está só na lista de espera ainda não teve a presença validada.
async function garantirInscricaoGeral(tx, usuarioId, edicaoId) {
  await tx.inscricaoEdicao.upsert({
    where: { usuarioId_edicaoId: { usuarioId, edicaoId } },
    update: {},
    create: { usuarioId, edicaoId },
  });
}

// Resumo pra tela "Credenciamento" da área do participante.
async function minhaSituacao(usuarioId, edicaoId) {
  const [inscricaoEdicao, presencas] = await Promise.all([
    prisma.inscricaoEdicao.findUnique({ where: { usuarioId_edicaoId: { usuarioId, edicaoId } } }),
    prisma.inscricaoAtividade.findMany({
      where: { usuarioId, atividade: { edicaoId }, presencaEm: { not: null } },
      include: { atividade: { select: { id: true, nome: true, local: true, inicioAtividade: true, fimAtividade: true } } },
      orderBy: { atividade: { inicioAtividade: "asc" } },
    }),
  ]);
  return {
    inscrito: Boolean(inscricaoEdicao),
    credenciadoEm: inscricaoEdicao?.credenciadoEm || null,
    presencas: presencas.map((item) => ({ ...projetarAtividade(item.atividade), presencaEm: item.presencaEm })),
  };
}

// ---------------------------------------------------------------------------
// Equipe (admin, seção CREDENCIAMENTO)
// ---------------------------------------------------------------------------

async function buscarEdicao(edicaoId) {
  const edicao = await prisma.edicao.findUnique({
    where: { id: edicaoId },
    select: { ...CAMPOS_EDICAO_QR, tokenCredenciamento: true },
  });
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
  return edicao;
}

async function buscarAtividade(edicaoId, atividadeId) {
  const atividade = await prisma.atividade.findFirst({
    where: { id: atividadeId, edicaoId },
    select: { ...CAMPOS_ATIVIDADE_QR, tokenPresenca: true },
  });
  if (!atividade) throw new ErroHttp(404, "Atividade não encontrada.");
  if (!atividade.exigeInscricao) throw new ErroHttp(409, "Esta atividade não exige inscrição, então não tem lista de presença.");
  return atividade;
}

async function buscarUsuario(usuarioId) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { id: true, ativo: true } });
  if (!usuario || !usuario.ativo) throw new ErroHttp(404, "Participante não encontrado.");
}

const INCLUDE_INSCRICAO_EDICAO = {
  usuario: { select: CAMPOS_USUARIO },
  credenciadoPor: CAMPOS_AUTOR,
};

async function listarCredenciamento(edicaoId) {
  const edicao = await buscarEdicao(edicaoId);
  const inscricoes = await prisma.inscricaoEdicao.findMany({
    where: { edicaoId },
    include: INCLUDE_INSCRICAO_EDICAO,
    orderBy: { createdAt: "asc" },
  });
  const { tokenCredenciamento, ...resto } = edicao;
  return {
    edicao: { ...resto, janela: janelaEvento(edicao) },
    inscricoes,
  };
}

async function credenciarPelaEquipe(edicaoId, usuarioId, autorId) {
  await buscarEdicao(edicaoId);
  await buscarUsuario(usuarioId);
  const { jaEstava } = await prisma.$transaction((tx) =>
    garantirCredenciamento(tx, usuarioId, edicaoId, { origem: "EQUIPE", autorId })
  );
  const inscricao = await prisma.inscricaoEdicao.findUnique({
    where: { usuarioId_edicaoId: { usuarioId, edicaoId } },
    include: INCLUDE_INSCRICAO_EDICAO,
  });
  return { inscricao, mensagem: jaEstava ? "Essa pessoa já estava credenciada." : "Credenciamento registrado." };
}

// Só apaga o credenciamento — a inscrição geral e as presenças continuam.
async function desfazerCredenciamento(edicaoId, usuarioId) {
  const inscricao = await prisma.inscricaoEdicao.findUnique({ where: { usuarioId_edicaoId: { usuarioId, edicaoId } } });
  if (!inscricao?.credenciadoEm) throw new ErroHttp(404, "Essa pessoa não está credenciada.");
  return prisma.inscricaoEdicao.update({
    where: { id: inscricao.id },
    data: { credenciadoEm: null, credenciamentoOrigem: null, credenciadoPorId: null },
    include: INCLUDE_INSCRICAO_EDICAO,
  });
}

async function listarAtividades(edicaoId) {
  await buscarEdicao(edicaoId);
  const atividades = await prisma.atividade.findMany({
    where: { edicaoId, exigeInscricao: true },
    select: {
      id: true,
      nome: true,
      local: true,
      inicioAtividade: true,
      fimAtividade: true,
      semLimiteVagas: true,
      vagas: true,
      ordem: true,
      inscricoes: { select: { status: true, presencaEm: true } },
    },
    orderBy: [{ inicioAtividade: "asc" }, { ordem: { sort: "asc", nulls: "last" } }, { nome: "asc" }],
  });
  return atividades.map(({ inscricoes, ...atividade }) => ({
    ...atividade,
    confirmadas: inscricoes.filter((item) => item.status === "CONFIRMADA").length,
    listaEspera: inscricoes.filter((item) => item.status === "LISTA_ESPERA").length,
    presentes: inscricoes.filter((item) => item.presencaEm).length,
    janela: janelaAtividade(atividade),
  }));
}

const INCLUDE_INSCRICAO_ATIVIDADE = {
  usuario: { select: CAMPOS_USUARIO },
  presencaRegistradaPor: CAMPOS_AUTOR,
};

async function listarPresencas(edicaoId, atividadeId) {
  const atividade = await buscarAtividade(edicaoId, atividadeId);
  const inscricoes = await prisma.inscricaoAtividade.findMany({
    where: { atividadeId },
    include: INCLUDE_INSCRICAO_ATIVIDADE,
    orderBy: { createdAt: "asc" },
  });
  const { tokenPresenca, edicao, ...resto } = atividade;
  return { atividade: { ...resto, janela: janelaAtividade(atividade) }, inscricoes };
}

// Presença registrada pela equipe (busca ou crachá), já sem presença antes:
// sem inscrição, cria pela regra de vagas (sem vaga fica na lista de espera);
// inscrita em espera, continua em espera — só a presença é validada. Também
// credencia no evento.
async function marcarPresencaPelaEquipe(tx, atividade, usuarioId, inscricaoAtual, { origem, autorId }) {
  let inscricao = inscricaoAtual;
  if (!inscricao) {
    const status = await inscricoesService.statusParaNovaInscricao(tx, atividade);
    inscricao = await tx.inscricaoAtividade.create({ data: { usuarioId, atividadeId: atividade.id, status } });
  }
  const atualizada = await tx.inscricaoAtividade.update({
    where: { id: inscricao.id },
    data: dadosPresenca(origem, autorId),
    include: INCLUDE_INSCRICAO_ATIVIDADE,
  });
  await garantirCredenciamento(tx, usuarioId, atividade.edicaoId, { origem, autorId });
  return { inscricao: atualizada, inscritaAgora: !inscricaoAtual };
}

// Vale para qualquer pessoa (ver marcarPresencaPelaEquipe).
async function registrarPresencaPelaEquipe(edicaoId, atividadeId, usuarioId, autorId) {
  const atividade = await buscarAtividade(edicaoId, atividadeId);
  await buscarUsuario(usuarioId);

  return prisma.$transaction(async (tx) => {
    const inscricao = await tx.inscricaoAtividade.findUnique({ where: { usuarioId_atividadeId: { usuarioId, atividadeId } } });
    if (inscricao?.presencaEm) {
      return { inscricao: await tx.inscricaoAtividade.findUnique({ where: { id: inscricao.id }, include: INCLUDE_INSCRICAO_ATIVIDADE }), mensagem: "A presença dessa pessoa já estava registrada." };
    }
    const { inscricao: atualizada } = await marcarPresencaPelaEquipe(tx, atividade, usuarioId, inscricao, { origem: "EQUIPE", autorId });
    return { inscricao: atualizada, mensagem: "Presença registrada." };
  });
}

// Só apaga a presença — a inscrição (e o credenciamento geral) continuam.
async function removerPresenca(edicaoId, atividadeId, usuarioId) {
  await buscarAtividade(edicaoId, atividadeId);
  const inscricao = await prisma.inscricaoAtividade.findUnique({ where: { usuarioId_atividadeId: { usuarioId, atividadeId } } });
  if (!inscricao?.presencaEm) throw new ErroHttp(404, "Essa pessoa não tem presença registrada nesta atividade.");
  return prisma.inscricaoAtividade.update({
    where: { id: inscricao.id },
    data: { presencaEm: null, presencaOrigem: null, presencaRegistradaPorId: null },
    include: INCLUDE_INSCRICAO_ATIVIDADE,
  });
}

// QR codes: o token nasce na primeira vez que alguém da equipe abre o QR.
async function qrEvento(edicaoId, { novo = false } = {}) {
  const edicao = await buscarEdicao(edicaoId);
  let token = edicao.tokenCredenciamento;
  if (!token || novo) {
    token = gerarToken("e");
    await prisma.edicao.update({ where: { id: edicaoId }, data: { tokenCredenciamento: token } });
  }
  return { url: urlDoToken(token), titulo: edicao.nome, subtitulo: "Credenciamento no evento" };
}

async function qrAtividade(edicaoId, atividadeId, { novo = false } = {}) {
  const atividade = await buscarAtividade(edicaoId, atividadeId);
  let token = atividade.tokenPresenca;
  if (!token || novo) {
    token = gerarToken("a");
    await prisma.atividade.update({ where: { id: atividadeId }, data: { tokenPresenca: token } });
  }
  return { url: urlDoToken(token), titulo: atividade.nome, subtitulo: "Presença na atividade", atividade: projetarAtividade(atividade) };
}

// Todos os QR das atividades de uma vez (impressão em lote), gerando os que faltam.
async function qrTodasAtividades(edicaoId) {
  const atividades = await prisma.atividade.findMany({
    where: { edicaoId, exigeInscricao: true },
    select: { id: true },
    orderBy: [{ inicioAtividade: "asc" }, { ordem: { sort: "asc", nulls: "last" } }, { nome: "asc" }],
  });
  const lista = [];
  for (const { id } of atividades) lista.push(await qrAtividade(edicaoId, id));
  return lista;
}

// ---------------------------------------------------------------------------
// Crachá virtual
// ---------------------------------------------------------------------------

const CAMPOS_PESSOA_CRACHA = { id: true, nome: true, foto: true, cpf: true, documentoEstrangeiro: true, pais: true, ativo: true };

// Só o suficiente para a equipe conferir com o documento na mão.
function documentoMascarado(usuario) {
  if (usuario.cpf && /^\d{11}$/.test(usuario.cpf)) {
    return `CPF ***.${usuario.cpf.slice(3, 6)}.${usuario.cpf.slice(6, 9)}-**`;
  }
  if (usuario.documentoEstrangeiro) {
    return `Documento ${usuario.pais ? `(${usuario.pais}) ` : ""}···${usuario.documentoEstrangeiro.slice(-4)}`;
  }
  return null;
}

// Usuario.foto é o path no bucket privado; a URL assinada sai a cada leitura.
async function projetarPessoa(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    foto: await storageService.gerarUrlAssinada(usuario.foto),
    documento: documentoMascarado(usuario),
  };
}

async function meuCracha(usuarioId, edicao, { novo = false } = {}) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { ...CAMPOS_PESSOA_CRACHA, tokenCracha: true } });
  if (!usuario) throw new ErroHttp(404, "Conta não encontrada.");

  let token = usuario.tokenCracha;
  if (!token || novo) {
    token = gerarToken("c", 18);
    await prisma.usuario.update({ where: { id: usuarioId }, data: { tokenCracha: token } });
  }

  const inscricao = edicao
    ? await prisma.inscricaoEdicao.findUnique({
        where: { usuarioId_edicaoId: { usuarioId, edicaoId: edicao.id } },
        select: { credenciadoEm: true },
      })
    : null;

  return {
    token,
    pessoa: await projetarPessoa(usuario),
    edicao: edicao ? { id: edicao.id, nome: edicao.nome } : null,
    credenciadoEm: inscricao?.credenciadoEm || null,
  };
}

async function resolverPessoa({ token, usuarioId }) {
  if (token !== undefined) {
    const invalido = new ErroHttp(404, "Crachá inválido ou substituído por um novo. Peça para a pessoa abrir o crachá de novo ou busque pelo nome.");
    if (typeof token !== "string" || !REGEX_TOKEN_CRACHA.test(token)) {
      if (typeof token === "string" && REGEX_TOKEN.test(token)) {
        throw new ErroHttp(400, "Este é o QR code de credenciamento afixado no evento, não o crachá de um participante.");
      }
      throw invalido;
    }
    const usuario = await prisma.usuario.findUnique({ where: { tokenCracha: token }, select: CAMPOS_PESSOA_CRACHA });
    if (!usuario || !usuario.ativo) throw invalido;
    return usuario;
  }
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: CAMPOS_PESSOA_CRACHA });
  if (!usuario || !usuario.ativo) throw new ErroHttp(404, "Participante não encontrado.");
  return usuario;
}

// Leitura no leitor da equipe: pelo crachá (`token`, origem CRACHA) ou pela
// busca de reserva (`usuarioId`, origem EQUIPE). Sem `atividadeId`, credencia
// no evento; com, registra a presença — na hora para inscrito confirmado,
// e para quem está na lista de espera ou nem se inscreveu só depois de a
// equipe confirmar (`confirmar`), para não ocupar vaga sem querer.
// `resultado`: REGISTRADO | JA_REGISTRADO | CONFIRMAR.
async function lerNaEquipe(edicaoId, { token, usuarioId, atividadeId, confirmar = false }, autorId) {
  const origem = token !== undefined ? "CRACHA" : "EQUIPE";
  const usuario = await resolverPessoa({ token, usuarioId });
  const pessoa = await projetarPessoa(usuario);

  if (!atividadeId) {
    await buscarEdicao(edicaoId);
    const { inscricao, jaEstava, inscritaAgora } = await prisma.$transaction((tx) =>
      garantirCredenciamento(tx, usuario.id, edicaoId, { origem, autorId })
    );
    if (jaEstava) {
      return { resultado: "JA_REGISTRADO", pessoa, registradoEm: inscricao.credenciadoEm, mensagem: `${pessoa.nome} já estava credenciado(a).` };
    }
    return {
      resultado: "REGISTRADO",
      pessoa,
      registradoEm: inscricao.credenciadoEm,
      mensagem: inscritaAgora ? "Credenciado(a). Não tinha inscrição e foi inscrito(a) agora." : "Credenciado(a) no evento.",
    };
  }

  const atividade = await buscarAtividade(edicaoId, atividadeId);
  return prisma.$transaction(async (tx) => {
    const inscricao = await tx.inscricaoAtividade.findUnique({
      where: { usuarioId_atividadeId: { usuarioId: usuario.id, atividadeId } },
    });
    if (inscricao?.presencaEm) {
      return { resultado: "JA_REGISTRADO", pessoa, registradoEm: inscricao.presencaEm, mensagem: `A presença de ${pessoa.nome} já estava registrada.` };
    }
    if (inscricao?.status !== "CONFIRMADA" && !confirmar) {
      const vaga = inscricao ? null : await temVaga(tx, atividade);
      return {
        resultado: "CONFIRMAR",
        pessoa,
        motivo: inscricao ? "LISTA_ESPERA" : "SEM_INSCRICAO",
        mensagem: inscricao
          ? "Está na lista de espera desta atividade. Registrar a presença mesmo assim? A situação na lista não muda."
          : vaga
            ? "Não está inscrito(a) nesta atividade. Registrar a presença inscreve agora (há vaga)."
            : "Não está inscrito(a) e não há mais vagas. Registrar a presença inscreve na lista de espera, com a presença validada.",
      };
    }
    const { inscricao: atualizada, inscritaAgora } = await marcarPresencaPelaEquipe(tx, atividade, usuario.id, inscricao, { origem, autorId });
    return {
      resultado: "REGISTRADO",
      pessoa,
      registradoEm: atualizada.presencaEm,
      mensagem: inscritaAgora ? "Inscrito(a) agora e presença registrada." : "Presença registrada.",
    };
  });
}

module.exports = {
  previa,
  credenciarEvento,
  registrarPresenca,
  minhaSituacao,
  listarCredenciamento,
  credenciarPelaEquipe,
  desfazerCredenciamento,
  listarAtividades,
  listarPresencas,
  registrarPresencaPelaEquipe,
  removerPresenca,
  qrEvento,
  qrAtividade,
  qrTodasAtividades,
  meuCracha,
  lerNaEquipe,
  // exportados para teste
  janelaEvento,
  janelaAtividade,
};
