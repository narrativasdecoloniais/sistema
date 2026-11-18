const prisma = require("../config/prisma");
const { temIdentificacao } = require("../utils/identificacao");
const { palavrasDoNome, palavrasCasam } = require("./regularizacaoContas.service");

// Para o admin: cada conta sem CPF/documento (Even3, convite pendente) com as
// contas que podem ser da mesma pessoa — nome parecido (mesmo critério da
// regularização pública, nas duas direções) ou o mesmo "começo" de e-mail em
// outro provedor. Só sugere; quem decide e unifica é o admin, pela prévia
// normal de /usuarios/unificacao (que ainda aplica todos os bloqueios).

const MAX_PARECIDAS = 8;
const WHERE_ELEGIVEL = { ativo: true, anonimizadoEm: null, papeis: { equals: ["PARTICIPANTE"] } };

function parteLocalDoEmail(email) {
  const local = String(email).toLowerCase().split("@")[0].split("+")[0];
  return local.replace(/[^a-z0-9]/g, "");
}

function casarNomes(a, b) {
  const casadas = a.filter((palavra) => b.some((outra) => palavrasCasam(palavra, outra))).length;
  const menor = Math.min(a.length, b.length);
  return { casadas, fracao: menor ? casadas / menor : 0 };
}

async function contarPorUsuario(modelo, ids) {
  const linhas = await prisma[modelo].groupBy({
    by: ["usuarioId"],
    where: { usuarioId: { in: ids } },
    _count: { _all: true },
  });
  return new Map(linhas.map((linha) => [linha.usuarioId, linha._count._all]));
}

async function listarContasSemCpfComParecidas() {
  const contas = await prisma.usuario.findMany({
    where: WHERE_ELEGIVEL,
    select: {
      id: true, nome: true, email: true, cpf: true, documentoEstrangeiro: true, pais: true,
      emailConfirmado: true, createdAt: true,
    },
  });

  const preparadas = contas.map((conta) => ({
    conta,
    palavras: palavrasDoNome(conta.nome),
    local: parteLocalDoEmail(conta.email),
  }));
  const semCpf = preparadas.filter((item) => !temIdentificacao(item.conta));

  const itens = [];
  for (const base of semCpf) {
    const parecidas = [];
    for (const outra of preparadas) {
      if (outra.conta.id === base.conta.id) continue;
      const { casadas, fracao } = casarNomes(base.palavras, outra.palavras);
      const nomeParecido = casadas >= 2 && fracao >= 0.75;
      const emailParecido =
        base.local.length >= 5 && base.local === outra.local && base.conta.email.split("@")[1] !== outra.conta.email.split("@")[1];
      if (!nomeParecido && !emailParecido) continue;
      const motivos = [];
      if (nomeParecido) motivos.push("Nome parecido");
      if (emailParecido) motivos.push("Mesmo começo de e-mail");
      parecidas.push({ conta: outra.conta, motivos, forca: (nomeParecido ? fracao : 0) + (emailParecido ? 1 : 0) });
    }
    if (parecidas.length === 0) continue;
    parecidas.sort((a, b) => b.forca - a.forca);
    itens.push({ conta: base.conta, parecidas: parecidas.slice(0, MAX_PARECIDAS) });
  }

  const ids = [...new Set(itens.flatMap((item) => [item.conta.id, ...item.parecidas.map((p) => p.conta.id)]))];
  const [inscEdicao, inscAtividade, submissoes, autorias] = ids.length
    ? await Promise.all([
        contarPorUsuario("inscricaoEdicao", ids),
        contarPorUsuario("inscricaoAtividade", ids),
        contarPorUsuario("submissao", ids),
        contarPorUsuario("submissaoAutor", ids),
      ])
    : [new Map(), new Map(), new Map(), new Map()];

  const comVinculos = (conta) => ({
    ...conta,
    vinculos: {
      inscricoesEdicao: inscEdicao.get(conta.id) || 0,
      inscricoesAtividade: inscAtividade.get(conta.id) || 0,
      submissoes: submissoes.get(conta.id) || 0,
      autorias: autorias.get(conta.id) || 0,
    },
  });

  return itens
    .map((item) => ({
      conta: comVinculos(item.conta),
      parecidas: item.parecidas.map((p) => ({ ...comVinculos(p.conta), motivos: p.motivos })),
    }))
    .sort((a, b) => a.conta.nome.localeCompare(b.conta.nome, "pt-BR"));
}

module.exports = { listarContasSemCpfComParecidas };
