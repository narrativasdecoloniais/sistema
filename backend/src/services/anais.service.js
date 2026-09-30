const prisma = require("../config/prisma");
const env = require("../config/env");
const ErroHttp = require("../utils/erroHttp");
const { FILTRO_SUBMISSOES_ANAIS } = require("../utils/criterioAnais");
const { gerarSlug } = require("../utils/slug");
const {
  CONFIG_RESUMO,
  CONFIG_REFERENCIA,
  CONFIG_EDITAL,
  criarPurificador,
  extrairTexto,
} = require("../utils/sanitizadorRichText");
const sanitizarApresentacaoAnais = require("../utils/sanitizarApresentacaoAnais");
const emailService = require("./email.service");

// Anais da edição (módulo 11): configuração da publicação, artigos
// (ArtigoAnais, um por submissão no critério de utils/criterioAnais.js),
// consultas das páginas públicas e comentários. A geração do PDF/Word fica
// em geracaoAnais.service.js.

// O conteúdo já foi sanitizado ao salvar; as páginas públicas sanitizam de
// novo na leitura pra poder renderizar no servidor (SEO) sem confiar só no
// que está no banco — ver ConteudoRichText (prop sanitizadoNoServidor).
// Os hooks são os mesmos para todas as configs, então uma instância basta.
const { DOMPurify, janela } = criarPurificador();

const TAMANHO_TRECHO_BUSCA = 1500;
const TAMANHO_DESCRICAO = 300;

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function textoPuro(html) {
  return extrairTexto(janela, html || "")
    .replace(/\s+/g, " ")
    .trim();
}

function recortar(texto, limite) {
  if (texto.length <= limite) return texto;
  const cortado = texto.slice(0, limite);
  const ultimoEspaco = cortado.lastIndexOf(" ");
  return `${(ultimoEspaco > limite * 0.6 ? cortado.slice(0, ultimoEspaco) : cortado).replace(/[\s,.;:]+$/, "")}…`;
}

function anoUtc(data) {
  return data ? new Date(data).getUTCFullYear() : null;
}

// "V Narrativas Interculturais…" -> "Narrativas Interculturais…": sugestão
// inicial do nome do evento na referência (o número entra à parte).
function nomeEventoSugerido(nomeEdicao) {
  return String(nomeEdicao || "")
    .replace(/^\s*[IVXLC]+\s*(?:[ºª°.]\s*)?(?:edição\s+(?:d[oa]s?\s+)?)?/i, "")
    .replace(/^[\s\-–—:]+/, "")
    .trim();
}

// Valores iniciais quando a organização ainda não salvou a configuração.
function configuracaoPadrao(edicao) {
  return {
    titulo: `Anais do ${edicao.nome}`,
    subtitulo: null,
    nomeEvento: nomeEventoSugerido(edicao.nome) || edicao.nome,
    issn: null,
    isbn: null,
    editora: null,
    localPublicacao: edicao.cidade || null,
    anoPublicacao: anoUtc(edicao.dataInicio),
    organizadores: [],
    licenca: "CC_BY",
    apresentacao: null,
    fichaCatalografica: null,
    gruposConteudoIds: [],
    publicadoEm: null,
    pdfUrl: null,
    pdfGeradoEm: null,
    docxUrl: null,
    docxGeradoEm: null,
    geracaoFormato: null,
    geracaoIniciadaEm: null,
    erroGeracao: null,
  };
}

const SELECT_EDICAO = {
  id: true,
  numero: true,
  nome: true,
  slug: true,
  cidade: true,
  estado: true,
  dataInicio: true,
  dataFim: true,
  resultadoDivulgadoEm: true,
  apresentacaoPublicadaEm: true,
};

async function buscarEdicao(edicaoId) {
  const edicao = await prisma.edicao.findUnique({
    where: { id: edicaoId },
    select: { ...SELECT_EDICAO, anais: true },
  });
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
  return edicao;
}

function urlArtigo(edicaoSlug, artigoSlug) {
  return `${env.frontendUrl}/anais/${edicaoSlug}/${artigoSlug}`;
}

// Dados da publicação usados na referência (utils/citacao.js, espelhado no
// front) — mesmo formato no PDF/Word e na página do artigo.
function dadosAnaisCitacao(edicao, anais) {
  return {
    titulo: anais.titulo,
    nomeEvento: anais.nomeEvento || edicao.nome,
    numeroEdicao: edicao.numero,
    anoEvento: anoUtc(edicao.dataInicio),
    cidadeEvento: edicao.cidade || null,
    localPublicacao: anais.localPublicacao || null,
    editora: anais.editora || null,
    anoPublicacao: anais.anoPublicacao || anoUtc(edicao.dataInicio),
    issn: anais.issn || null,
    isbn: anais.isbn || null,
  };
}

function dadosCitacao(edicao, anais, artigo, submissao) {
  return {
    titulo: submissao.titulo,
    autores: submissao.autores.map((autor) => autor.nome),
    anais: dadosAnaisCitacao(edicao, anais),
    paginaInicial: artigo.paginaInicial,
    paginaFinal: artigo.paginaFinal,
    url: edicao.slug ? urlArtigo(edicao.slug, artigo.slug) : null,
  };
}

// Ordem canônica dos Anais (página pública, sumário do PDF/Word,
// anterior/próximo): modalidade → área → título.
function compararArtigos(a, b) {
  const sa = a.submissao;
  const sb = b.submissao;
  return (
    (sa.modalidadeSubmissao?.ordem ?? 0) - (sb.modalidadeSubmissao?.ordem ?? 0) ||
    (sa.areaSubmissao?.ordem ?? Number.MAX_SAFE_INTEGER) - (sb.areaSubmissao?.ordem ?? Number.MAX_SAFE_INTEGER) ||
    sa.titulo.localeCompare(sb.titulo, "pt-BR", { sensitivity: "base" })
  );
}

function whereArtigosVisiveis(edicaoId) {
  return { edicaoId, ocultoEm: null, submissao: FILTRO_SUBMISSOES_ANAIS };
}

// ---------------------------------------------------------------------------
// Sincronização dos artigos
// ---------------------------------------------------------------------------

// Cria o ArtigoAnais (com slug fixo) de toda submissão que entrou no critério
// e ainda não tem. Nunca apaga: quem sai do critério só some das consultas.
async function sincronizarArtigos(edicaoId) {
  const novas = await prisma.submissao.findMany({
    where: { edicaoId, ...FILTRO_SUBMISSOES_ANAIS, artigoAnais: null },
    select: { id: true, titulo: true },
    orderBy: { createdAt: "asc" },
  });
  if (!novas.length) return 0;

  const existentes = await prisma.artigoAnais.findMany({ where: { edicaoId }, select: { slug: true } });
  const usados = new Set(existentes.map((artigo) => artigo.slug));

  const dados = novas.map((submissao) => {
    const base = gerarSlug(submissao.titulo) || "trabalho";
    let slug = base;
    for (let contador = 2; usados.has(slug); contador += 1) slug = `${base}-${contador}`;
    usados.add(slug);
    return { edicaoId, submissaoId: submissao.id, slug };
  });

  // skipDuplicates cobre duas sincronizações simultâneas: quem perder a
  // corrida é criado na próxima.
  const { count } = await prisma.artigoAnais.createMany({ data: dados, skipDuplicates: true });
  return count;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

async function obterPainel(edicaoId, { geracaoEmAndamento = null } = {}) {
  const edicao = await buscarEdicao(edicaoId);
  await sincronizarArtigos(edicaoId);

  const [publicados, ocultos, comentarios, comentariosOcultos, grupos] = await Promise.all([
    prisma.artigoAnais.count({ where: whereArtigosVisiveis(edicaoId) }),
    prisma.artigoAnais.count({ where: { edicaoId, ocultoEm: { not: null }, submissao: FILTRO_SUBMISSOES_ANAIS } }),
    prisma.comentarioAnais.count({ where: { artigoAnais: { edicaoId } } }),
    prisma.comentarioAnais.count({ where: { artigoAnais: { edicaoId }, ocultoEm: { not: null } } }),
    prisma.grupoConteudo.findMany({
      where: { edicaoId },
      select: { id: true, nome: true },
      orderBy: { ordem: "asc" },
    }),
  ]);

  const { anais, ...dadosEdicao } = edicao;
  return {
    edicao: dadosEdicao,
    configurado: Boolean(anais),
    anais: anais || configuracaoPadrao(edicao),
    gerando: geracaoEmAndamento,
    contagens: { publicados, ocultos, comentarios, comentariosOcultos },
    grupos,
  };
}

async function salvarConfiguracao(edicaoId, dados) {
  const edicao = await buscarEdicao(edicaoId);
  const campos = {
    ...dados,
    apresentacao: dados.apresentacao ? sanitizarApresentacaoAnais(dados.apresentacao) || null : null,
  };

  // Só aceita grupos da própria edição.
  if (campos.gruposConteudoIds.length) {
    const validos = await prisma.grupoConteudo.findMany({
      where: { edicaoId, id: { in: campos.gruposConteudoIds } },
      select: { id: true },
    });
    const ids = new Set(validos.map((grupo) => grupo.id));
    campos.gruposConteudoIds = campos.gruposConteudoIds.filter((id) => ids.has(id));
  }

  return prisma.anaisEdicao.upsert({
    where: { edicaoId: edicao.id },
    create: { edicaoId: edicao.id, ...campos },
    update: campos,
  });
}

async function definirPublicacao(edicaoId, publicar) {
  const edicao = await buscarEdicao(edicaoId);
  if (!edicao.anais) throw new ErroHttp(409, "Salve as configurações dos Anais antes de publicar.");

  if (publicar) {
    if (!edicao.resultadoDivulgadoEm) {
      throw new ErroHttp(409, "Os Anais só podem ser publicados depois da divulgação do resultado das submissões.");
    }
    if (!edicao.slug) {
      throw new ErroHttp(409, "Defina o endereço (slug) da edição em Configurações do evento antes de publicar os Anais.");
    }
    await sincronizarArtigos(edicaoId);
    const total = await prisma.artigoAnais.count({ where: whereArtigosVisiveis(edicaoId) });
    if (!total) throw new ErroHttp(409, "Não há nenhum trabalho para publicar nos Anais.");
  }

  return prisma.anaisEdicao.update({
    where: { edicaoId },
    data: { publicadoEm: publicar ? edicao.anais.publicadoEm || new Date() : null },
  });
}

async function listarArtigosAdmin(edicaoId) {
  const edicao = await buscarEdicao(edicaoId);
  await sincronizarArtigos(edicaoId);

  const artigos = await prisma.artigoAnais.findMany({
    where: { edicaoId, submissao: FILTRO_SUBMISSOES_ANAIS },
    select: {
      id: true,
      slug: true,
      ocultoEm: true,
      paginaInicial: true,
      paginaFinal: true,
      visualizacoes: true,
      downloads: true,
      _count: { select: { comentarios: true } },
      submissao: {
        select: {
          id: true,
          titulo: true,
          statusCorrecao: true,
          autores: { select: { nome: true }, orderBy: { ordem: "asc" } },
          modalidadeSubmissao: { select: { id: true, nome: true, ordem: true } },
          areaSubmissao: { select: { id: true, titulo: true, ordem: true } },
        },
      },
    },
  });

  artigos.sort(compararArtigos);
  return artigos.map(({ _count, ...artigo }) => ({
    ...artigo,
    comentarios: _count.comentarios,
    url: edicao.slug ? `/anais/${edicao.slug}/${artigo.slug}` : null,
  }));
}

async function definirOcultacao(edicaoId, ids, ocultar) {
  const { count } = await prisma.artigoAnais.updateMany({
    where: { edicaoId, id: { in: ids } },
    data: { ocultoEm: ocultar ? new Date() : null },
  });
  return count;
}

async function listarComentariosAdmin(edicaoId) {
  await buscarEdicao(edicaoId);
  return prisma.comentarioAnais.findMany({
    where: { artigoAnais: { edicaoId } },
    select: {
      id: true,
      texto: true,
      ocultoEm: true,
      respostaAId: true,
      createdAt: true,
      usuario: { select: { id: true, nome: true, email: true } },
      artigoAnais: { select: { id: true, slug: true, submissao: { select: { titulo: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function buscarComentarioDaEdicao(edicaoId, id) {
  const comentario = await prisma.comentarioAnais.findFirst({
    where: { id, artigoAnais: { edicaoId } },
    select: { id: true },
  });
  if (!comentario) throw new ErroHttp(404, "Comentário não encontrado.");
  return comentario;
}

async function definirOcultacaoComentario(edicaoId, id, ocultar, usuarioId) {
  await buscarComentarioDaEdicao(edicaoId, id);
  return prisma.comentarioAnais.update({
    where: { id },
    data: ocultar ? { ocultoEm: new Date(), ocultoPorId: usuarioId } : { ocultoEm: null, ocultoPorId: null },
    select: { id: true, ocultoEm: true },
  });
}

async function excluirComentarioAdmin(edicaoId, id) {
  await buscarComentarioDaEdicao(edicaoId, id);
  await prisma.comentarioAnais.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// Público
// ---------------------------------------------------------------------------

function anaisPublicos(anais) {
  return {
    titulo: anais.titulo,
    subtitulo: anais.subtitulo,
    nomeEvento: anais.nomeEvento,
    issn: anais.issn,
    isbn: anais.isbn,
    editora: anais.editora,
    localPublicacao: anais.localPublicacao,
    anoPublicacao: anais.anoPublicacao,
    organizadores: anais.organizadores,
    licenca: anais.licenca,
    apresentacao: anais.apresentacao ? DOMPurify.sanitize(anais.apresentacao, CONFIG_EDITAL) : null,
    publicadoEm: anais.publicadoEm,
    pdfUrl: anais.pdfUrl,
    atualizadoEm: anais.updatedAt,
  };
}

// Edição com Anais publicados, pelo slug — null se não existir/não publicada.
async function buscarEdicaoPublicada(edicaoSlug) {
  const edicao = await prisma.edicao.findUnique({
    where: { slug: edicaoSlug },
    select: { ...SELECT_EDICAO, anais: true },
  });
  if (!edicao?.anais?.publicadoEm) return null;
  return edicao;
}

async function listarEdicoesComAnais() {
  const edicoes = await prisma.edicao.findMany({
    where: { slug: { not: null }, anais: { publicadoEm: { not: null } } },
    select: {
      id: true,
      numero: true,
      nome: true,
      slug: true,
      dataInicio: true,
      cidade: true,
      anais: { select: { titulo: true, subtitulo: true, issn: true, isbn: true, pdfUrl: true, publicadoEm: true } },
    },
    orderBy: { numero: "desc" },
  });
  const contagens = await prisma.artigoAnais.groupBy({
    by: ["edicaoId"],
    where: {
      edicaoId: { in: edicoes.map((edicao) => edicao.id) },
      ocultoEm: null,
      submissao: FILTRO_SUBMISSOES_ANAIS,
    },
    _count: { _all: true },
  });
  const totalPorEdicao = Object.fromEntries(contagens.map((item) => [item.edicaoId, item._count._all]));
  return edicoes.map(({ id, ...edicao }) => ({ ...edicao, totalArtigos: totalPorEdicao[id] || 0 }));
}

const SELECT_SUBMISSAO_LISTA = {
  id: true,
  titulo: true,
  resumo: true,
  autores: { select: { nome: true, orcid: true }, orderBy: { ordem: "asc" } },
  modalidadeSubmissao: { select: { id: true, nome: true, slug: true, ordem: true } },
  areaSubmissao: { select: { id: true, titulo: true, slug: true, ordem: true } },
};

async function listarArtigosVisiveis(edicaoId, selectSubmissao = SELECT_SUBMISSAO_LISTA) {
  const artigos = await prisma.artigoAnais.findMany({
    where: whereArtigosVisiveis(edicaoId),
    select: {
      id: true,
      slug: true,
      paginaInicial: true,
      paginaFinal: true,
      submissao: { select: selectSubmissao },
    },
  });
  return artigos.sort(compararArtigos);
}

function artigoResumido(artigo) {
  const { submissao } = artigo;
  const texto = textoPuro(submissao.resumo);
  return {
    id: artigo.id,
    slug: artigo.slug,
    titulo: submissao.titulo,
    autores: submissao.autores,
    modalidade: submissao.modalidadeSubmissao,
    area: submissao.areaSubmissao,
    paginaInicial: artigo.paginaInicial,
    paginaFinal: artigo.paginaFinal,
    trecho: recortar(texto, TAMANHO_TRECHO_BUSCA),
  };
}

async function buscarAnaisPublicos(edicaoSlug) {
  const edicao = await buscarEdicaoPublicada(edicaoSlug);
  if (!edicao) return null;
  const artigos = await listarArtigosVisiveis(edicao.id);
  const { anais, ...dadosEdicao } = edicao;
  return {
    edicao: dadosEdicao,
    anais: anaisPublicos(anais),
    artigos: artigos.map(artigoResumido),
  };
}

async function buscarArtigoPublico(edicaoSlug, artigoSlug) {
  const edicao = await buscarEdicaoPublicada(edicaoSlug);
  if (!edicao) return null;

  const artigo = await prisma.artigoAnais.findFirst({
    where: { ...whereArtigosVisiveis(edicao.id), slug: artigoSlug },
    select: {
      id: true,
      slug: true,
      paginaInicial: true,
      paginaFinal: true,
      createdAt: true,
      submissao: {
        select: {
          ...SELECT_SUBMISSAO_LISTA,
          referenciaBibliografica: true,
          updatedAt: true,
          atividadeApresentacao: {
            select: { nome: true, slug: true, inicioAtividade: true, fimAtividade: true, local: true },
          },
        },
      },
    },
  });
  if (!artigo) return null;

  // Anterior/próximo e relacionados (mesma área) pela ordem dos Anais.
  const todos = await listarArtigosVisiveis(edicao.id, {
    id: true,
    titulo: true,
    autores: { select: { nome: true }, orderBy: { ordem: "asc" } },
    modalidadeSubmissao: { select: { ordem: true } },
    areaSubmissao: { select: { id: true, ordem: true } },
  });
  const indice = todos.findIndex((item) => item.id === artigo.id);
  const vizinho = (item) => item && { slug: item.slug, titulo: item.submissao.titulo };
  const areaId = artigo.submissao.areaSubmissao?.id;
  const daArea = areaId
    ? todos.filter((item) => item.id !== artigo.id && item.submissao.areaSubmissao?.id === areaId)
    : [];
  // Prefere os que vêm depois na ordem (continuação natural da leitura).
  const depois = daArea.filter((item) => todos.indexOf(item) > indice);
  const antes = daArea.filter((item) => todos.indexOf(item) < indice);
  const relacionados = [...depois, ...antes].slice(0, 4).map((item) => ({
    slug: item.slug,
    titulo: item.submissao.titulo,
    autores: item.submissao.autores.map((autor) => autor.nome),
  }));

  const { anais, ...dadosEdicao } = edicao;
  const { submissao } = artigo;
  const texto = textoPuro(submissao.resumo);

  return {
    edicao: dadosEdicao,
    anais: anaisPublicos(anais),
    artigo: {
      id: artigo.id,
      slug: artigo.slug,
      titulo: submissao.titulo,
      autores: submissao.autores,
      modalidade: submissao.modalidadeSubmissao,
      area: submissao.areaSubmissao,
      resumo: DOMPurify.sanitize(submissao.resumo, CONFIG_RESUMO),
      referenciaBibliografica: DOMPurify.sanitize(submissao.referenciaBibliografica, CONFIG_REFERENCIA),
      descricao: recortar(texto, TAMANHO_DESCRICAO),
      paginaInicial: artigo.paginaInicial,
      paginaFinal: artigo.paginaFinal,
      publicadoEm: anais.publicadoEm > artigo.createdAt ? anais.publicadoEm : artigo.createdAt,
      atualizadoEm: submissao.updatedAt,
      apresentacao: edicao.apresentacaoPublicadaEm ? submissao.atividadeApresentacao : null,
      citacao: dadosCitacao(edicao, anais, artigo, submissao),
    },
    anterior: vizinho(todos[indice - 1]),
    proximo: vizinho(todos[indice + 1]),
    relacionados,
  };
}

async function listarSitemap() {
  const edicoes = await prisma.edicao.findMany({
    where: { slug: { not: null }, anais: { publicadoEm: { not: null } } },
    select: { id: true, slug: true, anais: { select: { updatedAt: true } } },
  });
  const resultado = [];
  for (const edicao of edicoes) {
    const artigos = await prisma.artigoAnais.findMany({
      where: whereArtigosVisiveis(edicao.id),
      select: { slug: true, submissao: { select: { updatedAt: true } } },
    });
    resultado.push({
      slug: edicao.slug,
      atualizadoEm: edicao.anais.updatedAt,
      artigos: artigos.map((artigo) => ({ slug: artigo.slug, atualizadoEm: artigo.submissao.updatedAt })),
    });
  }
  return resultado;
}

// Artigo visível (Anais publicados, não oculto, no critério) — base das
// rotas públicas por id (comentários, contadores).
async function buscarArtigoVisivelPorId(artigoId) {
  const artigo = await prisma.artigoAnais.findFirst({
    where: {
      id: artigoId,
      ocultoEm: null,
      submissao: FILTRO_SUBMISSOES_ANAIS,
      edicao: { anais: { publicadoEm: { not: null } } },
    },
    select: {
      id: true,
      slug: true,
      edicaoId: true,
      edicao: { select: { nome: true, slug: true } },
      submissao: {
        select: {
          titulo: true,
          autores: { select: { nome: true, email: true, usuarioId: true } },
        },
      },
    },
  });
  if (!artigo) throw new ErroHttp(404, "Trabalho não encontrado nos Anais.");
  return artigo;
}

async function registrarVisualizacao(artigoId) {
  await buscarArtigoVisivelPorId(artigoId);
  await prisma.artigoAnais.update({ where: { id: artigoId }, data: { visualizacoes: { increment: 1 } } });
}

async function registrarDownload(artigoId) {
  await prisma.artigoAnais.update({ where: { id: artigoId }, data: { downloads: { increment: 1 } } });
}

// ---------------------------------------------------------------------------
// Comentários (públicos)
// ---------------------------------------------------------------------------

const SELECT_COMENTARIO = {
  id: true,
  texto: true,
  createdAt: true,
  respostaAId: true,
  usuario: { select: { id: true, nome: true, foto: true, anonimizadoEm: true } },
};

function comentarioPublico(comentario, idsAutores) {
  const { usuario } = comentario;
  return {
    id: comentario.id,
    texto: comentario.texto,
    criadoEm: comentario.createdAt,
    respostaAId: comentario.respostaAId,
    usuarioId: usuario.anonimizadoEm ? null : usuario.id,
    nome: usuario.anonimizadoEm ? "Participante" : usuario.nome,
    foto: usuario.anonimizadoEm ? null : usuario.foto,
    autorDoTrabalho: !usuario.anonimizadoEm && idsAutores.has(usuario.id),
  };
}

function idsDosAutores(artigo) {
  return new Set(artigo.submissao.autores.map((autor) => autor.usuarioId).filter(Boolean));
}

async function listarComentariosPublicos(artigoId) {
  const artigo = await buscarArtigoVisivelPorId(artigoId);
  const idsAutores = idsDosAutores(artigo);
  const raizes = await prisma.comentarioAnais.findMany({
    where: { artigoAnaisId: artigoId, respostaAId: null, ocultoEm: null },
    select: {
      ...SELECT_COMENTARIO,
      respostas: { where: { ocultoEm: null }, select: SELECT_COMENTARIO, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });
  return raizes.map((raiz) => ({
    ...comentarioPublico(raiz, idsAutores),
    respostas: raiz.respostas.map((resposta) => comentarioPublico(resposta, idsAutores)),
  }));
}

async function avisarAutoresSobreComentario(artigo, comentario, usuarioId) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { email: true } });
  const emailQuemComentou = usuario?.email?.toLowerCase();
  const vistos = new Set();
  const destinatarios = artigo.submissao.autores.filter((autor) => {
    const email = autor.email?.toLowerCase();
    if (!email || email === emailQuemComentou || autor.usuarioId === usuarioId || vistos.has(email)) return false;
    vistos.add(email);
    return true;
  });
  const link = `${urlArtigo(artigo.edicao.slug, artigo.slug)}#comentarios`;
  for (const autor of destinatarios) {
    try {
      await emailService.enviarEmailNovoComentarioAnais(autor, {
        edicao: artigo.edicao,
        titulo: artigo.submissao.titulo,
        comentario,
        link,
      });
    } catch (erro) {
      console.error(`[anais] falha ao avisar ${autor.email} sobre comentário:`, erro.message);
    }
  }
}

async function criarComentario(usuarioId, artigoId, { texto, respostaAId }) {
  const artigo = await buscarArtigoVisivelPorId(artigoId);

  if (respostaAId) {
    const pai = await prisma.comentarioAnais.findFirst({
      where: { id: respostaAId, artigoAnaisId: artigoId, respostaAId: null, ocultoEm: null },
      select: { id: true },
    });
    if (!pai) throw new ErroHttp(404, "O comentário que você quer responder não existe mais.");
  }

  const comentario = await prisma.comentarioAnais.create({
    data: { artigoAnaisId: artigoId, usuarioId, texto, respostaAId: respostaAId || null },
    select: SELECT_COMENTARIO,
  });
  const publico = comentarioPublico(comentario, idsDosAutores(artigo));

  // Segundo plano: o comentário já está publicado, o e-mail não segura a
  // resposta nem derruba a requisição se falhar.
  avisarAutoresSobreComentario(artigo, publico, usuarioId).catch((erro) =>
    console.error("[anais] falha ao avisar autores sobre comentário:", erro.message)
  );

  return { ...publico, respostas: [] };
}

async function excluirComentarioProprio(usuarioId, id) {
  const comentario = await prisma.comentarioAnais.findUnique({ where: { id }, select: { usuarioId: true } });
  if (!comentario || comentario.usuarioId !== usuarioId) throw new ErroHttp(404, "Comentário não encontrado.");
  await prisma.comentarioAnais.delete({ where: { id } });
}

module.exports = {
  compararArtigos,
  dadosAnaisCitacao,
  dadosCitacao,
  urlArtigo,
  textoPuro,
  buscarEdicao,
  buscarEdicaoPublicada,
  sincronizarArtigos,
  listarArtigosVisiveis,
  obterPainel,
  salvarConfiguracao,
  definirPublicacao,
  listarArtigosAdmin,
  definirOcultacao,
  listarComentariosAdmin,
  definirOcultacaoComentario,
  excluirComentarioAdmin,
  listarEdicoesComAnais,
  buscarAnaisPublicos,
  buscarArtigoPublico,
  listarSitemap,
  buscarArtigoVisivelPorId,
  registrarVisualizacao,
  registrarDownload,
  listarComentariosPublicos,
  criarComentario,
  excluirComentarioProprio,
};
