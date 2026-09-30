const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const env = require("../config/env");
const ErroHttp = require("../utils/erroHttp");
const sanitizarResumoSubmissao = require("../utils/sanitizarResumoSubmissao");
const sanitizarReferenciaBibliografica = require("../utils/sanitizarReferenciaBibliografica");
const processarImagensEmbutidas = require("../utils/processarImagensEmbutidas");
const prazoSubmissaoAberto = require("../utils/prazoSubmissaoAberto");
const avaliacoesService = require("./avaliacoes.service");
const { prazoCorrecaoAberto, formatarPrazoCorrecao } = require("../utils/prazoCorrecao");

const TIPO_TOKEN = "submissao";
// Mais longo que o de inscrição (30m) — preencher resumo/referência e
// procurar coautores leva mais tempo que escolher atividades.
const EXPIRACAO_TOKEN = "60m";

function gerarTokenSubmissao(usuarioId) {
  return jwt.sign({ tipo: TIPO_TOKEN, sub: usuarioId }, env.jwtAccessSecret, {
    expiresIn: EXPIRACAO_TOKEN,
  });
}

function verificarTokenSubmissao(token) {
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    if (payload.tipo !== TIPO_TOKEN) return null;
    return payload;
  } catch {
    return null;
  }
}

// ignorarPrazo: inserção pela organização (Recebimento), que pode incluir um
// trabalho fora do prazo da modalidade.
async function criarSubmissao(usuarioId, edicaoId, dados, { ignorarPrazo = false } = {}) {
  const modalidade = await prisma.modalidadeSubmissao.findFirst({
    where: { id: dados.modalidadeSubmissaoId, edicaoId },
    include: { areas: true },
  });
  if (!modalidade) throw new ErroHttp(404, "Modalidade de submissão não encontrada.");

  if (!ignorarPrazo && !prazoSubmissaoAberto(modalidade.prazoInicio, modalidade.prazoFim)) {
    throw new ErroHttp(400, "O prazo de submissão desta modalidade não está aberto.");
  }

  if (modalidade.areas.length > 0 && !dados.areaSubmissaoId) {
    throw new ErroHttp(400, "Selecione a área temática desta modalidade.");
  }

  if (dados.areaSubmissaoId && !modalidade.areas.some((area) => area.id === dados.areaSubmissaoId)) {
    throw new ErroHttp(400, "A área selecionada não pertence a essa modalidade.");
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario || !usuario.ativo) throw new ErroHttp(404, "Usuário não encontrado.");

  const resumo = await processarImagensEmbutidas(
    sanitizarResumoSubmissao(dados.resumo),
    "submissoes-resumo"
  );
  const referenciaBibliografica = sanitizarReferenciaBibliografica(dados.referenciaBibliografica);

  const emailsCoautores = dados.coautores.map((coautor) => coautor.email);
  // mode: "insensitive" porque e-mail não é normalizado no cadastro (ver
  // usuarios.service.js) — sem isso, "Ana@x.com" digitada aqui não bateria
  // com uma conta salva como "ana@x.com".
  const usuariosCoautores = emailsCoautores.length
    ? await prisma.usuario.findMany({ where: { email: { in: emailsCoautores, mode: "insensitive" } } })
    : [];
  const usuarioPorEmail = new Map(usuariosCoautores.map((u) => [u.email.toLowerCase(), u]));

  const autores = [
    { nome: usuario.nome, email: usuario.email, orcid: null, usuarioId: usuario.id, principal: true, ordem: 0 },
    ...dados.coautores.map((coautor, indice) => {
      const usuarioEncontrado = usuarioPorEmail.get(coautor.email.toLowerCase());
      return {
        nome: usuarioEncontrado?.nome || coautor.nome,
        email: coautor.email,
        orcid: coautor.orcid || null,
        usuarioId: usuarioEncontrado?.id || null,
        principal: false,
        ordem: indice + 1,
      };
    }),
  ];

  return prisma.$transaction(async (tx) => {
    const submissao = await tx.submissao.create({
      data: {
        edicaoId,
        modalidadeSubmissaoId: modalidade.id,
        areaSubmissaoId: dados.areaSubmissaoId || null,
        titulo: dados.titulo,
        resumo,
        referenciaBibliografica,
        usuarioId: usuario.id,
        autores: { create: autores },
      },
      include: { autores: { orderBy: { ordem: "asc" } } },
    });
    await avaliacoesService.distribuirSubmissao(tx, submissao.id);
    return submissao;
  });
}

const DECISOES_COM_CORRECAO = ["APROVADO_COM_RESSALVAS", "APROVADO_FORMATACAO"];

function textoVisivel(html) {
  return html.replace(/<img[^>]*>/g, "imagem").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

// Correção pedida no resultado — só o autor principal, dentro do prazo, com
// correção pendente ou devolvida. Guarda o texto anterior em SubmissaoVersao.
async function corrigirSubmissao(usuarioId, submissaoId, dados) {
  const submissao = await prisma.submissao.findUnique({
    where: { id: submissaoId },
    include: {
      edicao: { select: { resultadoDivulgadoEm: true, prazoCorrecaoSubmissao: true } },
      autores: { select: { usuarioId: true } },
    },
  });
  if (!submissao || !submissao.autores.some((autor) => autor.usuarioId === usuarioId)) {
    throw new ErroHttp(404, "Submissão não encontrada.");
  }
  if (submissao.usuarioId !== usuarioId) {
    throw new ErroHttp(403, "Só o autor principal pode enviar a correção do trabalho.");
  }
  if (
    !submissao.edicao.resultadoDivulgadoEm ||
    !DECISOES_COM_CORRECAO.includes(submissao.decisaoFinal) ||
    !["PENDENTE", "DEVOLVIDA"].includes(submissao.statusCorrecao)
  ) {
    throw new ErroHttp(409, "Este trabalho não tem correção pendente.");
  }
  if (!prazoCorrecaoAberto(submissao.edicao.prazoCorrecaoSubmissao)) {
    throw new ErroHttp(
      409,
      `O prazo de correção terminou em ${formatarPrazoCorrecao(submissao.edicao.prazoCorrecaoSubmissao)}. Fale com a organização.`
    );
  }

  const resumo = await processarImagensEmbutidas(sanitizarResumoSubmissao(dados.resumo), "submissoes-resumo");
  const referenciaBibliografica = sanitizarReferenciaBibliografica(dados.referenciaBibliografica);
  if (!textoVisivel(resumo)) throw new ErroHttp(400, "Informe o resumo.");
  if (!textoVisivel(referenciaBibliografica)) throw new ErroHttp(400, "Informe a referência bibliográfica.");

  const comRessalvas = submissao.decisaoFinal === "APROVADO_COM_RESSALVAS";
  const titulo = comRessalvas && dados.titulo ? dados.titulo : submissao.titulo;

  await prisma.$transaction([
    prisma.submissaoVersao.create({
      data: {
        submissaoId,
        titulo: submissao.titulo,
        resumo: submissao.resumo,
        referenciaBibliografica: submissao.referenciaBibliografica,
      },
    }),
    prisma.submissao.update({
      where: { id: submissaoId },
      data: {
        titulo,
        resumo,
        referenciaBibliografica,
        correcaoEnviadaEm: new Date(),
        // Ressalvas passam pela conferência da organização; formatação
        // conclui direto — o autor só está validando o próprio texto.
        statusCorrecao: comRessalvas ? "ENVIADA" : "CONCLUIDA",
      },
    }),
  ]);
}

module.exports = {
  corrigirSubmissao,
  gerarTokenSubmissao,
  verificarTokenSubmissao,
  criarSubmissao,
};
