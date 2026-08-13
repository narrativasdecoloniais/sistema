const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const env = require("../config/env");
const ErroHttp = require("../utils/erroHttp");

const TIPO_TOKEN = "inscricao";
const EXPIRACAO_TOKEN = "30m";

function gerarTokenInscricao(usuarioId) {
  return jwt.sign({ tipo: TIPO_TOKEN, sub: usuarioId }, env.jwtAccessSecret, {
    expiresIn: EXPIRACAO_TOKEN,
  });
}

function verificarTokenInscricao(token) {
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    if (payload.tipo !== TIPO_TOKEN) return null;
    return payload;
  } catch {
    return null;
  }
}

async function buscarInscricaoEdicao(usuarioId, edicaoId) {
  return prisma.inscricaoEdicao.findUnique({
    where: { usuarioId_edicaoId: { usuarioId, edicaoId } },
  });
}

async function buscarInscricaoCompleta(edicaoId, usuarioId) {
  const [inscricaoEdicao, inscricoesAtividade] = await Promise.all([
    buscarInscricaoEdicao(usuarioId, edicaoId),
    prisma.inscricaoAtividade.findMany({
      where: { usuarioId, atividade: { edicaoId } },
      include: {
        atividade: {
          select: { id: true, nome: true, inicioAtividade: true, fimAtividade: true, local: true },
        },
      },
      orderBy: { atividade: { inicioAtividade: "asc" } },
    }),
  ]);

  return { inscricaoEdicao, inscricoesAtividade };
}

async function listarAtividadesParaInscricao(edicaoId, usuarioId) {
  const atividades = await prisma.atividade.findMany({
    where: { edicaoId, exigeInscricao: true },
    include: { tipoAtividade: true },
    orderBy: { createdAt: "asc" },
  });

  if (atividades.length === 0) return [];

  const atividadeIds = atividades.map((atividade) => atividade.id);

  const [contagens, inscricoesDoUsuario] = await Promise.all([
    prisma.inscricaoAtividade.groupBy({
      by: ["atividadeId"],
      where: { atividadeId: { in: atividadeIds }, status: "CONFIRMADA" },
      _count: { _all: true },
    }),
    prisma.inscricaoAtividade.findMany({
      where: { usuarioId, atividadeId: { in: atividadeIds } },
    }),
  ]);

  const ocupadasPorAtividade = new Map(
    contagens.map((linha) => [linha.atividadeId, linha._count._all])
  );
  const statusPorAtividade = new Map(
    inscricoesDoUsuario.map((inscricao) => [inscricao.atividadeId, inscricao.status])
  );

  return atividades.map((atividade) => {
    const vagasOcupadas = ocupadasPorAtividade.get(atividade.id) || 0;
    const vagasRestantes = atividade.semLimiteVagas
      ? null
      : Math.max(0, atividade.vagas - vagasOcupadas);
    const lotada = !atividade.semLimiteVagas && vagasRestantes === 0;

    return {
      ...atividade,
      vagasOcupadas,
      vagasRestantes,
      lotada,
      statusInscricaoAtual: statusPorAtividade.get(atividade.id) || null,
    };
  });
}

async function buscarEstadoInscricao(edicaoId, usuarioId) {
  const jaInscrito = await buscarInscricaoEdicao(usuarioId, edicaoId);
  if (jaInscrito) {
    const [inscricaoAtual, atividadesComStatus] = await Promise.all([
      buscarInscricaoCompleta(edicaoId, usuarioId),
      listarAtividadesParaInscricao(edicaoId, usuarioId),
    ]);
    const atividades = atividadesComStatus.filter((atividade) => !atividade.statusInscricaoAtual);
    return { jaInscritoNaEdicao: true, inscricaoAtual, atividades };
  }

  const atividades = await listarAtividadesParaInscricao(edicaoId, usuarioId);
  return { jaInscritoNaEdicao: false, atividades };
}

// Sobreposição parcial conta como conflito; um horário que termina exatamente
// quando o outro começa não conta (toque de ponta-a-ponta é permitido).
// Mesma lógica espelhada em frontend/lib/inscricao.js#haSobreposicao (só
// para feedback imediato no client) — manter sincronizado se mudar; esta
// função aqui é a autoridade real.
function haSobreposicao(a, b) {
  return a.inicioAtividade < b.fimAtividade && b.inicioAtividade < a.fimAtividade;
}

function validarSemConflitos(atividades) {
  for (let i = 0; i < atividades.length; i += 1) {
    for (let j = i + 1; j < atividades.length; j += 1) {
      if (haSobreposicao(atividades[i], atividades[j])) {
        throw new ErroHttp(
          409,
          `As atividades "${atividades[i].nome}" e "${atividades[j].nome}" têm horários conflitantes.`
        );
      }
    }
  }
}

async function finalizarInscricao({ usuarioId, edicaoId, atividadeIds }) {
  const jaEstavaInscrito = Boolean(await buscarInscricaoEdicao(usuarioId, edicaoId));

  const atividadesSelecionadas =
    atividadeIds.length > 0
      ? await prisma.atividade.findMany({
          where: { id: { in: atividadeIds }, edicaoId, exigeInscricao: true },
        })
      : [];

  if (atividadesSelecionadas.length !== atividadeIds.length) {
    throw new ErroHttp(400, "Uma ou mais atividades selecionadas são inválidas.");
  }

  if (jaEstavaInscrito && atividadesSelecionadas.length > 0) {
    const inscricoesExistentes = await prisma.inscricaoAtividade.findMany({
      where: { usuarioId, atividadeId: { in: atividadeIds } },
      include: { atividade: { select: { nome: true } } },
    });
    if (inscricoesExistentes.length > 0) {
      throw new ErroHttp(
        409,
        `Você já está inscrito(a) na atividade "${inscricoesExistentes[0].atividade.nome}".`
      );
    }
  }

  let atividadesJaInscritas = [];
  if (jaEstavaInscrito) {
    const inscricoesAnteriores = await prisma.inscricaoAtividade.findMany({
      where: { usuarioId, atividade: { edicaoId } },
      include: { atividade: true },
    });
    atividadesJaInscritas = inscricoesAnteriores.map((inscricao) => inscricao.atividade);
  }

  validarSemConflitos([...atividadesJaInscritas, ...atividadesSelecionadas]);

  const idsCriadosAgora = await prisma.$transaction(async (tx) => {
    await tx.inscricaoEdicao.upsert({
      where: { usuarioId_edicaoId: { usuarioId, edicaoId } },
      update: {},
      create: { usuarioId, edicaoId },
    });

    const criados = [];
    for (const atividade of atividadesSelecionadas) {
      let status = "CONFIRMADA";
      if (!atividade.semLimiteVagas) {
        const confirmadas = await tx.inscricaoAtividade.count({
          where: { atividadeId: atividade.id, status: "CONFIRMADA" },
        });
        status = confirmadas < atividade.vagas ? "CONFIRMADA" : "LISTA_ESPERA";
      }

      const inscricaoAtividade = await tx.inscricaoAtividade.create({
        data: { usuarioId, atividadeId: atividade.id, status },
      });
      criados.push(inscricaoAtividade.id);
    }

    return criados;
  });

  const { inscricaoEdicao, inscricoesAtividade } = await buscarInscricaoCompleta(edicaoId, usuarioId);
  return { inscricaoEdicao, inscricoesAtividade, novas: idsCriadosAgora, jaEstavaInscrito };
}

async function cancelarInscricaoAtividade(usuarioId, inscricaoAtividadeId) {
  const inscricaoAtividade = await prisma.inscricaoAtividade.findUnique({
    where: { id: inscricaoAtividadeId },
  });

  if (!inscricaoAtividade || inscricaoAtividade.usuarioId !== usuarioId) {
    throw new ErroHttp(404, "Inscrição em atividade não encontrada.");
  }

  await prisma.inscricaoAtividade.delete({ where: { id: inscricaoAtividadeId } });
}

module.exports = {
  gerarTokenInscricao,
  verificarTokenInscricao,
  buscarInscricaoEdicao,
  buscarInscricaoCompleta,
  buscarEstadoInscricao,
  listarAtividadesParaInscricao,
  haSobreposicao,
  validarSemConflitos,
  finalizarInscricao,
  cancelarInscricaoAtividade,
};
