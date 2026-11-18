const prisma = require("../config/prisma");

// Acesso de monitores ao painel admin: o admin escolhe, por edição
// (Edicao.secoesMonitores), as seções liberadas; vale para quem tem a
// inscrição de monitoria SELECIONADO naquela edição e só nela. Ao deixar de
// ser selecionado a pessoa perde o acesso sozinha — nada é copiado para o
// usuário nem para o JWT, a checagem é sempre no banco.

// Dados pessoais de candidatos (MONITORIA) e gestão de contas (PARTICIPANTES)
// nunca são delegados a monitores.
// Os catálogos globais (tipos) não pertencem a uma edição, então também ficam
// de fora — a checagem por edição não os alcançaria.
const SECOES_NAO_DELEGAVEIS = [
  "PARTICIPANTES",
  "MONITORIA",
  "TIPOS_ATIVIDADE",
  "TIPOS_PARTICIPACAO",
  "TIPOS_PONTO_INTERESSE",
];

const FILTRO_SELECIONADO = { status: "SELECIONADO" };

// Seções que o usuário tem numa edição como monitor ([] = nenhuma).
async function secoesDoMonitorNaEdicao(usuarioId, edicaoId) {
  if (!usuarioId || !edicaoId) return [];
  const inscricao = await prisma.inscricaoMonitoria.findFirst({
    where: { usuarioId, edicaoId, ...FILTRO_SELECIONADO },
    select: { edicao: { select: { secoesMonitores: true } } },
  });
  return inscricao ? inscricao.edicao.secoesMonitores : [];
}

// { [edicaoId]: secoes[] } para todas as edições em que a pessoa é monitora
// selecionada e há alguma seção liberada.
async function acessoMonitorPorEdicao(usuarioId) {
  const inscricoes = await prisma.inscricaoMonitoria.findMany({
    where: { usuarioId, ...FILTRO_SELECIONADO, edicao: { secoesMonitores: { isEmpty: false } } },
    select: { edicaoId: true, edicao: { select: { secoesMonitores: true } } },
  });
  return Object.fromEntries(inscricoes.map((i) => [i.edicaoId, i.edicao.secoesMonitores]));
}

module.exports = { SECOES_NAO_DELEGAVEIS, secoesDoMonitorNaEdicao, acessoMonitorPorEdicao };
