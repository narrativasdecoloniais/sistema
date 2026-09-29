const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const INCLUDE_SUBMISSAO = require("../utils/submissaoIncludePadrao");
const emailService = require("./email.service");

// Só trabalho aprovado (qualquer um dos três tipos) vai para uma atividade.
const DECISOES_APROVADAS = ["APROVADO", "APROVADO_COM_RESSALVAS", "APROVADO_FORMATACAO"];

const INTERVALO_ENVIO_MS = 600;
const enviosEmAndamento = new Set();

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

async function buscarEdicao(db, edicaoId) {
  const edicao = await db.edicao.findUnique({
    where: { id: edicaoId },
    select: { id: true, nome: true, slug: true, resultadoDivulgadoEm: true, apresentacaoPublicadaEm: true },
  });
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
  return edicao;
}

function statusAviso(submissao) {
  if (!submissao.atividadeApresentacaoId) return null;
  if (submissao.emailApresentacaoAtividadeId === submissao.atividadeApresentacaoId) return "AVISADO";
  if (submissao.emailApresentacaoErro) return "ERRO";
  return "NAO_AVISADO";
}

// Renumera 1..n a ordem de uma atividade (depois de remover/mover trabalhos),
// mantendo a sequência relativa.
async function renumerar(db, atividadeId) {
  const trabalhos = await db.submissao.findMany({
    where: { atividadeApresentacaoId: atividadeId },
    orderBy: [{ ordemApresentacao: "asc" }, { titulo: "asc" }],
    select: { id: true, ordemApresentacao: true },
  });
  for (const [indice, trabalho] of trabalhos.entries()) {
    if (trabalho.ordemApresentacao !== indice + 1) {
      await db.submissao.update({ where: { id: trabalho.id }, data: { ordemApresentacao: indice + 1 } });
    }
  }
}

async function listar(edicaoId) {
  const edicao = await buscarEdicao(prisma, edicaoId);
  const [submissoes, atividades] = await Promise.all([
    prisma.submissao.findMany({
      where: { edicaoId, decisaoFinal: { in: DECISOES_APROVADAS } },
      include: INCLUDE_SUBMISSAO,
      orderBy: { titulo: "asc" },
    }),
    prisma.atividade.findMany({
      where: { edicaoId },
      select: {
        id: true,
        nome: true,
        slug: true,
        local: true,
        inicioAtividade: true,
        fimAtividade: true,
        areaSubmissaoId: true,
        tipoAtividade: { select: { id: true, nome: true } },
        _count: { select: { trabalhosApresentados: true } },
      },
      orderBy: [{ inicioAtividade: "asc" }, { nome: "asc" }],
    }),
  ]);

  const trabalhos = submissoes.map((submissao) => ({
    id: submissao.id,
    titulo: submissao.titulo,
    decisaoFinal: submissao.decisaoFinal,
    modalidadeSubmissao: submissao.modalidadeSubmissao,
    areaSubmissao: submissao.areaSubmissao,
    autores: submissao.autores.map((autor) => ({
      id: autor.id,
      nome: autor.nome,
      email: autor.email,
      orcid: autor.orcid,
      principal: autor.principal,
    })),
    // Para o modal de detalhe (o mesmo do Recebimento, que troca a área).
    resumo: submissao.resumo,
    referenciaBibliografica: submissao.referenciaBibliografica,
    createdAt: submissao.createdAt,
    atividadeApresentacaoId: submissao.atividadeApresentacaoId,
    ordemApresentacao: submissao.ordemApresentacao,
    statusAviso: statusAviso(submissao),
    emailApresentacaoErro: submissao.emailApresentacaoErro,
  }));

  const avisosPendentes = trabalhos.filter((trabalho) => trabalho.statusAviso && trabalho.statusAviso !== "AVISADO").length;

  return {
    trabalhos,
    atividades: atividades.map(({ _count, ...atividade }) => ({ ...atividade, totalTrabalhos: _count.trabalhosApresentados })),
    estado: {
      publicadaEm: edicao.apresentacaoPublicadaEm,
      resultadoDivulgado: Boolean(edicao.resultadoDivulgadoEm),
      avisosPendentes,
      avisosComErro: trabalhos.filter((trabalho) => trabalho.statusAviso === "ERRO").length,
      enviando: enviosEmAndamento.has(edicaoId),
    },
  };
}

async function carregarElegiveis(db, edicaoId, submissaoIds) {
  const submissoes = await db.submissao.findMany({
    where: { id: { in: submissaoIds }, edicaoId },
    select: { id: true, decisaoFinal: true, atividadeApresentacaoId: true },
  });
  if (submissoes.length !== submissaoIds.length) throw new ErroHttp(404, "Submissão não encontrada.");
  if (submissoes.some((submissao) => !DECISOES_APROVADAS.includes(submissao.decisaoFinal))) {
    throw new ErroHttp(409, "Só trabalhos aprovados podem ser vinculados a uma atividade.");
  }
  return submissoes;
}

async function vincularNaTransacao(tx, edicaoId, { submissaoIds, atividadeId }) {
  const atividade = await tx.atividade.findUnique({ where: { id: atividadeId }, select: { edicaoId: true } });
  if (!atividade || atividade.edicaoId !== edicaoId) throw new ErroHttp(404, "Atividade não encontrada.");

  const submissoes = await carregarElegiveis(tx, edicaoId, submissaoIds);
  const porId = new Map(submissoes.map((submissao) => [submissao.id, submissao]));
  // Mantém a ordem em que chegaram (ordem de seleção na tela).
  const aMover = submissaoIds.map((id) => porId.get(id)).filter((s) => s.atividadeApresentacaoId !== atividadeId);
  if (aMover.length === 0) return 0;

  const ultima = await tx.submissao.aggregate({
    where: { atividadeApresentacaoId: atividadeId },
    _max: { ordemApresentacao: true },
  });
  let ordem = ultima._max.ordemApresentacao || 0;
  const origens = new Set(aMover.map((s) => s.atividadeApresentacaoId).filter(Boolean));

  for (const submissao of aMover) {
    ordem += 1;
    await tx.submissao.update({
      where: { id: submissao.id },
      data: { atividadeApresentacaoId: atividadeId, ordemApresentacao: ordem, emailApresentacaoErro: null },
    });
  }
  for (const origem of origens) await renumerar(tx, origem);
  return aMover.length;
}

async function vincular(edicaoId, dados) {
  await buscarEdicao(prisma, edicaoId);
  return prisma.$transaction((tx) => vincularNaTransacao(tx, edicaoId, dados));
}

async function desvincular(edicaoId, { submissaoIds }) {
  await buscarEdicao(prisma, edicaoId);
  return prisma.$transaction(async (tx) => {
    const submissoes = await tx.submissao.findMany({
      where: { id: { in: submissaoIds }, edicaoId },
      select: { id: true, atividadeApresentacaoId: true },
    });
    if (submissoes.length !== submissaoIds.length) throw new ErroHttp(404, "Submissão não encontrada.");
    const origens = new Set(submissoes.map((s) => s.atividadeApresentacaoId).filter(Boolean));
    await tx.submissao.updateMany({
      where: { id: { in: submissaoIds } },
      data: { atividadeApresentacaoId: null, ordemApresentacao: null, emailApresentacaoErro: null },
    });
    for (const origem of origens) await renumerar(tx, origem);
    return submissoes.filter((s) => s.atividadeApresentacaoId).length;
  });
}

async function reordenar(edicaoId, atividadeId, submissaoIds) {
  await buscarEdicao(prisma, edicaoId);
  await prisma.$transaction(async (tx) => {
    const atividade = await tx.atividade.findUnique({ where: { id: atividadeId }, select: { edicaoId: true } });
    if (!atividade || atividade.edicaoId !== edicaoId) throw new ErroHttp(404, "Atividade não encontrada.");

    const atuais = await tx.submissao.findMany({ where: { atividadeApresentacaoId: atividadeId }, select: { id: true } });
    const conjuntoAtual = new Set(atuais.map((s) => s.id));
    if (atuais.length !== submissaoIds.length || submissaoIds.some((id) => !conjuntoAtual.has(id))) {
      throw new ErroHttp(400, "A lista precisa ter exatamente os trabalhos da atividade. Recarregue a página.");
    }
    for (const [indice, id] of submissaoIds.entries()) {
      await tx.submissao.update({ where: { id }, data: { ordemApresentacao: indice + 1 } });
    }
  });
}

// Vincula automaticamente os aprovados ainda sem atividade às atividades da
// própria área. Área com várias atividades (ex. as sessões de um mesmo
// conversatório): cada trabalho vai para a atividade menos carregada naquele
// momento — contando o que ela já tem —, empate pela que começa mais cedo e
// depois pelo nome. Resultado: cargas finais niveladas (10 em 3 vazias =
// 4/3/3). Trabalhos entram em ordem de título, no fim de cada atividade.
// Com simular, só calcula (mesma ordem estável, então a prévia bate com a
// aplicação).
async function distribuirPelaArea(edicaoId, { simular }) {
  await buscarEdicao(prisma, edicaoId);
  const [pendentes, atividades] = await Promise.all([
    prisma.submissao.findMany({
      where: { edicaoId, decisaoFinal: { in: DECISOES_APROVADAS }, atividadeApresentacaoId: null },
      select: { id: true, areaSubmissaoId: true, areaSubmissao: { select: { titulo: true } } },
      orderBy: [{ titulo: "asc" }, { id: "asc" }],
    }),
    prisma.atividade.findMany({
      where: { edicaoId, areaSubmissaoId: { not: null } },
      select: {
        id: true,
        nome: true,
        areaSubmissaoId: true,
        inicioAtividade: true,
        _count: { select: { trabalhosApresentados: true } },
      },
    }),
  ]);

  const atividadesPorArea = new Map();
  for (const atividade of atividades) {
    const lista = atividadesPorArea.get(atividade.areaSubmissaoId) || [];
    lista.push({ ...atividade, carga: atividade._count.trabalhosApresentados, novos: [] });
    atividadesPorArea.set(atividade.areaSubmissaoId, lista);
  }

  const compararCarga = (a, b) =>
    a.carga - b.carga ||
    new Date(a.inicioAtividade) - new Date(b.inicioAtividade) ||
    a.nome.localeCompare(b.nome, "pt-BR");

  let semAtividade = 0;
  const areasComNovos = new Map();
  for (const submissao of pendentes) {
    const opcoes = submissao.areaSubmissaoId ? atividadesPorArea.get(submissao.areaSubmissaoId) : null;
    if (!opcoes || opcoes.length === 0) {
      semAtividade += 1;
      continue;
    }
    const destino = [...opcoes].sort(compararCarga)[0];
    destino.carga += 1;
    destino.novos.push(submissao.id);
    areasComNovos.set(submissao.areaSubmissaoId, submissao.areaSubmissao?.titulo || "Sem título");
  }

  const porArea = [...areasComNovos.entries()]
    .map(([areaId, titulo]) => {
      const lista = atividadesPorArea
        .get(areaId)
        .slice()
        .sort((a, b) => new Date(a.inicioAtividade) - new Date(b.inicioAtividade) || a.nome.localeCompare(b.nome, "pt-BR"));
      return {
        area: titulo,
        totalNovos: lista.reduce((soma, atividade) => soma + atividade.novos.length, 0),
        atividades: lista.map((atividade) => ({
          id: atividade.id,
          nome: atividade.nome,
          novos: atividade.novos.length,
          totalFinal: atividade.carga,
        })),
      };
    })
    .sort((a, b) => a.area.localeCompare(b.area, "pt-BR", { numeric: true }));

  const vinculados = porArea.reduce((soma, area) => soma + area.totalNovos, 0);

  if (!simular && vinculados > 0) {
    await prisma.$transaction(
      async (tx) => {
        for (const lista of atividadesPorArea.values()) {
          for (const atividade of lista) {
            if (atividade.novos.length > 0) {
              await vincularNaTransacao(tx, edicaoId, { atividadeId: atividade.id, submissaoIds: atividade.novos });
            }
          }
        }
      },
      // Centenas de updates numa transação só — folga além dos 5 s padrão.
      { timeout: 60_000 }
    );
  }

  return { vinculados, semAtividade, porArea };
}

async function publicar(edicaoId, publicarDistribuicao) {
  const edicao = await buscarEdicao(prisma, edicaoId);
  if (publicarDistribuicao && !edicao.resultadoDivulgadoEm) {
    throw new ErroHttp(409, "Divulgue o resultado das submissões antes de publicar a distribuição.");
  }
  const atualizada = await prisma.edicao.update({
    where: { id: edicaoId },
    data: { apresentacaoPublicadaEm: publicarDistribuicao ? new Date() : null },
    select: { apresentacaoPublicadaEm: true },
  });
  return atualizada.apresentacaoPublicadaEm;
}

async function iniciarAvisos(edicaoId) {
  const edicao = await buscarEdicao(prisma, edicaoId);
  if (!edicao.resultadoDivulgadoEm) throw new ErroHttp(409, "Divulgue o resultado das submissões antes de avisar os autores.");
  if (!edicao.apresentacaoPublicadaEm) {
    throw new ErroHttp(409, "Publique a distribuição antes de avisar os autores — o e-mail aponta para a página da atividade.");
  }
  if (enviosEmAndamento.has(edicaoId)) throw new ErroHttp(409, "O envio dos avisos já está em andamento.");

  enviarAvisosPendentes(edicaoId).catch((erro) => {
    console.error(`[apresentacao] Falha no envio de avisos da edição ${edicaoId}:`, erro);
  });
}

// Um e-mail por autor de cada trabalho ainda não avisado da atividade atual.
async function enviarAvisosPendentes(edicaoId) {
  if (enviosEmAndamento.has(edicaoId)) return;
  enviosEmAndamento.add(edicaoId);
  try {
    const edicao = await buscarEdicao(prisma, edicaoId);
    const candidatos = await prisma.submissao.findMany({
      where: { edicaoId, atividadeApresentacaoId: { not: null } },
      include: {
        autores: { orderBy: { ordem: "asc" } },
        atividadeApresentacao: {
          select: { id: true, nome: true, slug: true, local: true, inicioAtividade: true, fimAtividade: true },
        },
      },
      orderBy: { titulo: "asc" },
    });
    const pendentes = candidatos.filter((s) => s.emailApresentacaoAtividadeId !== s.atividadeApresentacaoId);

    for (const submissao of pendentes) {
      try {
        for (const autor of submissao.autores) {
          await emailService.enviarEmailApresentacao(autor, {
            edicao,
            trabalho: submissao,
            atividade: submissao.atividadeApresentacao,
            ordem: submissao.ordemApresentacao,
          });
          await esperar(INTERVALO_ENVIO_MS);
        }
        await prisma.submissao.update({
          where: { id: submissao.id },
          data: {
            emailApresentacaoAtividadeId: submissao.atividadeApresentacaoId,
            emailApresentacaoEnviadoEm: new Date(),
            emailApresentacaoErro: null,
          },
        });
      } catch (erro) {
        console.error(`[apresentacao] Aviso da submissão ${submissao.id} falhou:`, erro.message);
        await prisma.submissao.update({
          where: { id: submissao.id },
          data: { emailApresentacaoErro: String(erro.message).slice(0, 500) },
        });
      }
    }
  } finally {
    enviosEmAndamento.delete(edicaoId);
  }
}

// Usado pela avaliação: decisão final que deixa de ser aprovada tira o
// trabalho da atividade (só possível antes da divulgação do resultado).
async function removerSeNaoAprovada(db, submissaoId, novaDecisao) {
  if (DECISOES_APROVADAS.includes(novaDecisao)) return;
  const atual = await db.submissao.findUnique({ where: { id: submissaoId }, select: { atividadeApresentacaoId: true } });
  if (!atual?.atividadeApresentacaoId) return;
  await db.submissao.update({
    where: { id: submissaoId },
    data: { atividadeApresentacaoId: null, ordemApresentacao: null },
  });
  await renumerar(db, atual.atividadeApresentacaoId);
}

module.exports = {
  DECISOES_APROVADAS,
  listar,
  vincular,
  desvincular,
  reordenar,
  distribuirPelaArea,
  publicar,
  iniciarAvisos,
  enviarAvisosPendentes,
  removerSeNaoAprovada,
};
