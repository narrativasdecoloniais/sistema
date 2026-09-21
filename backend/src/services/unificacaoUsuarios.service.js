const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const { operacoesAnonimizacao } = require("./usuarios.service");

// Unifica duas contas da mesma pessoa (caso típico: conta importada do Even3,
// sem CPF e com as submissões, mais uma conta nova criada pela inscrição com
// outro e-mail). Tudo da conta "removida" vai pra conta "mantida" e a removida
// é anonimizada (nunca DELETE — LGPD/integridade referencial, ver
// anonimizarUsuario). Só mexe nos vínculos que existem hoje no schema:
// inscrição geral, inscrição em atividade, submissão e autoria de submissão —
// se um model novo passar a referenciar Usuario, precisa entrar aqui.

const SELECT_CONTA = {
  id: true,
  nome: true,
  email: true,
  cpf: true,
  emailConfirmado: true,
  ativo: true,
  anonimizadoEm: true,
  papeis: true,
  createdAt: true,
};

async function carregarConta(db, id, rotulo) {
  const conta = await db.usuario.findUnique({ where: { id }, select: SELECT_CONTA });
  if (!conta || !conta.ativo || conta.anonimizadoEm) {
    throw new ErroHttp(404, `A conta ${rotulo} não foi encontrada ou está inativa.`);
  }
  return conta;
}

async function contarVinculos(db, usuarioId) {
  const [inscricoesEdicao, inscricoesAtividade, submissoes, autorias] = await Promise.all([
    db.inscricaoEdicao.count({ where: { usuarioId } }),
    db.inscricaoAtividade.count({ where: { usuarioId } }),
    db.submissao.count({ where: { usuarioId } }),
    db.submissaoAutor.count({ where: { usuarioId } }),
  ]);
  return { inscricoesEdicao, inscricoesAtividade, submissoes, autorias };
}

function resumirConta(conta, vinculos) {
  return {
    id: conta.id,
    nome: conta.nome,
    email: conta.email,
    cpf: conta.cpf,
    emailConfirmado: conta.emailConfirmado,
    criadaEm: conta.createdAt,
    vinculos,
  };
}

// Lê o estado das duas contas e diz se a unificação pode acontecer
// (bloqueios) e o que ela vai fazer de menos óbvio (avisos). Serve tanto pra
// prévia mostrada ao gestor quanto pra revalidar dentro da transação.
async function analisar(db, manterId, removerId) {
  if (manterId === removerId) {
    throw new ErroHttp(400, "Escolha duas contas diferentes.");
  }

  const [manter, remover] = await Promise.all([
    carregarConta(db, manterId, "que permanece"),
    carregarConta(db, removerId, "a ser unificada"),
  ]);

  const bloqueios = [];
  const avisos = [];

  if (manter.papeis.some((p) => p !== "PARTICIPANTE") || remover.papeis.some((p) => p !== "PARTICIPANTE")) {
    bloqueios.push("Contas de administradores e organizadores não podem ser unificadas por aqui.");
  }

  // Dois CPFs diferentes quase certamente são duas pessoas — não junta.
  if (manter.cpf && remover.cpf && manter.cpf !== remover.cpf) {
    bloqueios.push("As duas contas têm CPFs diferentes, então provavelmente são pessoas diferentes.");
  }

  const [atividadesManter, atividadesRemover, edicoesManter, edicoesRemover] = await Promise.all([
    db.inscricaoAtividade.findMany({ where: { usuarioId: manterId }, select: { atividadeId: true } }),
    db.inscricaoAtividade.findMany({
      where: { usuarioId: removerId },
      select: { atividadeId: true, atividade: { select: { nome: true } } },
    }),
    db.inscricaoEdicao.findMany({ where: { usuarioId: manterId }, select: { edicaoId: true } }),
    db.inscricaoEdicao.findMany({ where: { usuarioId: removerId }, select: { edicaoId: true } }),
  ]);

  // Mesma atividade nas duas contas: juntar exigiria descartar uma inscrição
  // (e mexer em vaga/lista de espera), então fica pro gestor resolver antes.
  const idsAtividadeManter = new Set(atividadesManter.map((i) => i.atividadeId));
  const atividadesEmComum = atividadesRemover
    .filter((i) => idsAtividadeManter.has(i.atividadeId))
    .map((i) => i.atividade.nome);
  if (atividadesEmComum.length > 0) {
    bloqueios.push(
      `As duas contas estão inscritas na mesma atividade (${atividadesEmComum.join("; ")}). Cancele uma das inscrições antes de unificar.`
    );
  }

  const idsEdicaoManter = new Set(edicoesManter.map((i) => i.edicaoId));
  if (edicoesRemover.some((i) => idsEdicaoManter.has(i.edicaoId))) {
    avisos.push("As duas contas têm inscrição geral na mesma edição; a da conta unificada será descartada.");
  }

  const [vinculosManter, vinculosRemover] = await Promise.all([
    contarVinculos(db, manterId),
    contarVinculos(db, removerId),
  ]);

  const cpfFinal = manter.cpf || remover.cpf || null;
  if (!manter.cpf && remover.cpf) {
    avisos.push("O CPF da conta unificada passará para a conta que permanece.");
  }
  if (!manter.emailConfirmado) {
    avisos.push("O e-mail da conta que permanece ainda não está confirmado — sem isso a pessoa não consegue fazer login.");
  }

  return {
    manter,
    remover,
    previa: {
      manter: resumirConta(manter, vinculosManter),
      remover: resumirConta(remover, vinculosRemover),
      cpfFinal,
      bloqueios,
      avisos,
    },
  };
}

async function previaUnificacao(manterId, removerId) {
  const { previa } = await analisar(prisma, manterId, removerId);
  return previa;
}

async function unificarUsuarios({ manterId, removerId, confirmarEmail = false }) {
  return prisma.$transaction(
    async (tx) => {
      const { manter, remover, previa } = await analisar(tx, manterId, removerId);
      if (previa.bloqueios.length > 0) {
        throw new ErroHttp(409, previa.bloqueios[0]);
      }

      // Inscrição geral: uma por edição. Se a conta mantida já tem a da
      // mesma edição, a da removida é descartada (as inscrições em atividade
      // seguem ligadas ao usuário, não a ela).
      const edicoesManter = (
        await tx.inscricaoEdicao.findMany({ where: { usuarioId: manterId }, select: { edicaoId: true } })
      ).map((i) => i.edicaoId);
      await tx.inscricaoEdicao.deleteMany({
        where: { usuarioId: removerId, edicaoId: { in: edicoesManter } },
      });
      await tx.inscricaoEdicao.updateMany({ where: { usuarioId: removerId }, data: { usuarioId: manterId } });

      await tx.inscricaoAtividade.updateMany({ where: { usuarioId: removerId }, data: { usuarioId: manterId } });
      await tx.submissao.updateMany({ where: { usuarioId: removerId }, data: { usuarioId: manterId } });

      // Autoria: se as duas contas são autoras da mesma submissão, sobra a da
      // mantida (herdando o "principal" se a descartada era a principal).
      const submissoesDaMantida = (
        await tx.submissaoAutor.findMany({ where: { usuarioId: manterId }, select: { submissaoId: true } })
      ).map((a) => a.submissaoId);
      const autoriasDuplicadas = await tx.submissaoAutor.findMany({
        where: { usuarioId: removerId, submissaoId: { in: submissoesDaMantida } },
        select: { id: true, submissaoId: true, principal: true },
      });
      for (const duplicada of autoriasDuplicadas.filter((a) => a.principal)) {
        await tx.submissaoAutor.updateMany({
          where: { usuarioId: manterId, submissaoId: duplicada.submissaoId },
          data: { principal: true },
        });
      }
      await tx.submissaoAutor.deleteMany({ where: { id: { in: autoriasDuplicadas.map((a) => a.id) } } });
      await tx.submissaoAutor.updateMany({ where: { usuarioId: removerId }, data: { usuarioId: manterId } });

      // Anonimiza antes de gravar o CPF na mantida: o campo é único, e só
      // depois disso o CPF da removida fica livre.
      for (const operacao of operacoesAnonimizacao(removerId, tx)) {
        await operacao;
      }

      const dadosMantida = {};
      if (!manter.cpf && remover.cpf) dadosMantida.cpf = remover.cpf;
      if (confirmarEmail) dadosMantida.emailConfirmado = true;

      const atualizada = await tx.usuario.update({
        where: { id: manterId },
        data: dadosMantida,
        select: { id: true, nome: true, email: true, cpf: true, emailConfirmado: true },
      });

      const vinculos = await contarVinculos(tx, manterId);
      return { usuario: atualizada, vinculos };
    },
    { timeout: 30000 }
  );
}

module.exports = { previaUnificacao, unificarUsuarios };
