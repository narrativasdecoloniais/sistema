const prisma = require("../config/prisma");
const ErroHttp = require("../utils/erroHttp");
const INCLUDE_PADRAO = require("../utils/submissaoIncludePadrao");
const sanitizarResumoSubmissao = require("../utils/sanitizarResumoSubmissao");
const sanitizarReferenciaBibliografica = require("../utils/sanitizarReferenciaBibliografica");
const processarImagensEmbutidas = require("../utils/processarImagensEmbutidas");
const { DATA_URI_IMAGEM } = require("../utils/sanitizadorRichText");
const storageService = require("./storage.service");
const { distribuirSubmissao } = require("./avaliacoes.service");
const submissoesService = require("./submissoes.service");
const usuariosService = require("./usuarios.service");
const convitesCoautorService = require("./convitesCoautor.service");
const tokenService = require("./token.service");
const emailService = require("./email.service");

// Autosave do editor salva a cada poucos segundos — guarda uma cópia do
// texto anterior no máximo uma vez por janela, não uma por salvamento.
const JANELA_VERSAO_ORGANIZACAO_MS = 30 * 60 * 1000;
const TAMANHO_MAX_IMAGEM = 7_000_000; // ~5 MB de arquivo em base64

async function listarPorEdicao(edicaoId, { modalidadeSubmissaoId, areaSubmissaoId } = {}) {
  return prisma.submissao.findMany({
    where: {
      edicaoId,
      ...(modalidadeSubmissaoId ? { modalidadeSubmissaoId } : {}),
      ...(areaSubmissaoId ? { areaSubmissaoId } : {}),
    },
    include: INCLUDE_PADRAO,
    orderBy: { createdAt: "desc" },
  });
}

// Autor principal: conta escolhida na busca ou, pelo e-mail, a conta que já
// existe; sem conta, cria uma sem CPF e sem senha utilizável (convidado) —
// CPF, senha e aceites vêm quando a pessoa aceita o convite em /definir-senha.
async function resolverAutorPrincipal({ usuarioId, nome, email }) {
  const usuario = usuarioId
    ? await prisma.usuario.findUnique({ where: { id: usuarioId } })
    : await usuariosService.buscarPorEmail(email);

  if (usuario) {
    if (!usuario.ativo || usuario.anonimizadoEm) {
      throw new ErroHttp(409, usuarioId ? "Usuário não encontrado." : "Este e-mail pertence a uma conta desativada.");
    }
    return { usuario, convidado: false };
  }
  if (usuarioId) throw new ErroHttp(404, "Usuário não encontrado.");

  const novo = await usuariosService.criarUsuarioConvidado({ nome, email, papeis: ["PARTICIPANTE"] });
  return { usuario: novo, convidado: true };
}

// Inserção manual pela organização: mesmo caminho do envio pelo autor
// (autores, vínculo de contas, distribuição aos avaliadores), mas sem prazo.
// Depois do resultado divulgado as decisões ficam travadas — o trabalho nunca
// teria decisão final, então a inserção é bloqueada.
async function criarPelaOrganizacao(edicaoId, { usuarioId, nome, email, ...dados }) {
  const edicao = await prisma.edicao.findUnique({ where: { id: edicaoId }, select: { resultadoDivulgadoEm: true } });
  if (edicao?.resultadoDivulgadoEm) {
    throw new ErroHttp(409, "O resultado desta edição já foi divulgado — não é possível inserir novas submissões.");
  }

  const { usuario, convidado } = await resolverAutorPrincipal({ usuarioId, nome, email });

  let submissao;
  try {
    submissao = await submissoesService.criarSubmissao(usuario.id, edicaoId, dados, { ignorarPrazo: true });
  } catch (erro) {
    // Conta criada nesta mesma requisição e ainda sem nenhum vínculo — se a
    // submissão falhou (área inválida etc.), desfaz em vez de deixar uma
    // conta órfã que bloquearia o e-mail na próxima tentativa.
    if (convidado) await prisma.usuario.delete({ where: { id: usuario.id } }).catch(() => {});
    throw erro;
  }

  let conviteEnviado = null;
  if (convidado) {
    await usuariosService.associarAutoriasPendentes(usuario.id, usuario.email);
    // Falha no e-mail não desfaz a submissão (já criada e distribuída) — o
    // gestor é avisado; sem o convite, a pessoa vincula o CPF à conta pela
    // página "Regularizar cadastro".
    try {
      const token = await tokenService.criarTokenConviteAutor(usuario.id);
      await emailService.enviarEmailConviteAutor(usuario, token, submissao.titulo);
      conviteEnviado = true;
    } catch (erro) {
      console.error("Falha ao enviar convite de autor:", erro);
      conviteEnviado = false;
    }
  }

  convitesCoautorService.convidarCoautoresDaSubmissao(submissao.id);
  return { submissao: await buscarPorId(submissao.id), conviteEnviado };
}

async function buscarPorId(id) {
  return prisma.submissao.findUnique({ where: { id }, include: INCLUDE_PADRAO });
}

async function excluir(id) {
  await prisma.submissao.delete({ where: { id } });
}

// Correção de enquadramento pela organização, só dentro da mesma modalidade.
// Sem decisão final, vale o mesmo que uma troca sugerida aprovada: as
// atribuições da área antiga caem e o trabalho é redistribuído. Com decisão
// final, a avaliação já acabou — só a área muda, o histórico fica.
async function alterarArea(edicaoId, id, areaSubmissaoId, usuarioId) {
  return prisma.$transaction(async (tx) => {
    const submissao = await tx.submissao.findUnique({
      where: { id },
      select: { edicaoId: true, modalidadeSubmissaoId: true, areaSubmissaoId: true, decisaoFinal: true },
    });
    if (!submissao || submissao.edicaoId !== edicaoId) throw new ErroHttp(404, "Submissão não encontrada.");

    const area = await tx.areaSubmissao.findUnique({
      where: { id: areaSubmissaoId },
      select: { modalidadeSubmissaoId: true },
    });
    if (!area || area.modalidadeSubmissaoId !== submissao.modalidadeSubmissaoId) {
      throw new ErroHttp(400, "Selecione uma área da mesma modalidade do trabalho.");
    }

    if (submissao.areaSubmissaoId !== areaSubmissaoId) {
      await tx.submissao.update({ where: { id }, data: { areaSubmissaoId } });

      // Sugestões pendentes perdem o sentido: a que apontava pra nova área
      // conta como aprovada, as demais como recusadas.
      const resolucao = { resolvidoPorId: usuarioId, resolvidoEm: new Date() };
      await tx.sugestaoTrocaArea.updateMany({
        where: { submissaoId: id, status: "PENDENTE", areaSugeridaId: areaSubmissaoId },
        data: { status: "APROVADA", ...resolucao },
      });
      await tx.sugestaoTrocaArea.updateMany({
        where: { submissaoId: id, status: "PENDENTE" },
        data: { status: "RECUSADA", ...resolucao },
      });

      if (!submissao.decisaoFinal) {
        await tx.atribuicaoAvaliacao.deleteMany({ where: { submissaoId: id } });
        await distribuirSubmissao(tx, id);
      }
    }

    return tx.submissao.findUnique({ where: { id }, include: INCLUDE_PADRAO });
  });
}

async function buscarDaEdicao(edicaoId, id) {
  const submissao = await prisma.submissao.findUnique({
    where: { id },
    select: {
      id: true,
      edicaoId: true,
      titulo: true,
      resumo: true,
      referenciaBibliografica: true,
      updatedAt: true,
      decisaoFinal: true,
      statusCorrecao: true,
      modalidadeSubmissao: { select: { id: true, nome: true } },
      areaSubmissao: { select: { id: true, titulo: true } },
      edicao: { select: { nome: true, prazoCorrecaoSubmissao: true } },
    },
  });
  if (!submissao || submissao.edicaoId !== edicaoId) throw new ErroHttp(404, "Submissão não encontrada.");
  return submissao;
}

async function buscarParaEdicao(edicaoId, id) {
  return buscarDaEdicao(edicaoId, id);
}

// Concorrência otimista: versaoBase é o updatedAt que o editor carregou (ou
// recebeu no último salvamento). Se outra aba, outro gestor ou o autor
// corrigindo salvou no meio, o salvamento é recusado em vez de sobrescrever.
async function salvarConteudo(edicaoId, id, { titulo, resumo, referenciaBibliografica, versaoBase }, usuarioId) {
  const atual = await buscarDaEdicao(edicaoId, id);
  if (atual.updatedAt.getTime() !== new Date(versaoBase).getTime()) {
    throw new ErroHttp(409, "Este trabalho foi alterado em outra janela. Recarregue a página para continuar.");
  }

  const resumoSanitizado = await processarImagensEmbutidas(sanitizarResumoSubmissao(resumo), "submissoes-resumo");
  const referenciaSanitizada = sanitizarReferenciaBibliografica(referenciaBibliografica);

  return prisma.$transaction(async (tx) => {
    const versaoRecente = await tx.submissaoVersao.findFirst({
      where: {
        submissaoId: id,
        origem: "ORGANIZACAO",
        createdAt: { gte: new Date(Date.now() - JANELA_VERSAO_ORGANIZACAO_MS) },
      },
      select: { id: true },
    });
    if (!versaoRecente) {
      await tx.submissaoVersao.create({
        data: {
          submissaoId: id,
          titulo: atual.titulo,
          resumo: atual.resumo,
          referenciaBibliografica: atual.referenciaBibliografica,
          origem: "ORGANIZACAO",
          editadoPorId: usuarioId,
        },
      });
    }

    // updatedAt no filtro fecha a janela entre a checagem acima e a escrita
    // (dois salvamentos quase simultâneos) — o segundo cai no 409.
    const { count } = await tx.submissao.updateMany({
      where: { id, updatedAt: atual.updatedAt },
      data: { titulo, resumo: resumoSanitizado, referenciaBibliografica: referenciaSanitizada },
    });
    if (count === 0) {
      throw new ErroHttp(409, "Este trabalho foi alterado em outra janela. Recarregue a página para continuar.");
    }

    return tx.submissao.findUnique({
      where: { id },
      select: { updatedAt: true, titulo: true, resumo: true, referenciaBibliografica: true },
    });
  });
}

// Imagem inserida no editor da organização sobe na hora (o editor guarda só
// a URL) — assim o autosave nunca reenvia o mesmo data URI.
async function enviarImagem(edicaoId, id, dataUri) {
  await buscarDaEdicao(edicaoId, id);
  if (typeof dataUri !== "string" || !DATA_URI_IMAGEM.test(dataUri)) {
    throw new ErroHttp(400, "Envie uma imagem PNG, JPEG, GIF ou WebP.");
  }
  if (dataUri.length > TAMANHO_MAX_IMAGEM) throw new ErroHttp(400, "Imagem muito grande (máximo de 5 MB).");
  return storageService.salvarImagemPublica(dataUri, "submissoes-resumo");
}

module.exports = {
  listarPorEdicao,
  criarPelaOrganizacao,
  buscarPorId,
  excluir,
  alterarArea,
  buscarParaEdicao,
  salvarConteudo,
  enviarImagem,
};
