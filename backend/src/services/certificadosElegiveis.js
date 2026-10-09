const {
  formatarPeriodo,
  romano,
  juntarLista,
  formatarDocumento,
} = require("../utils/marcadoresCertificado");

// Quem tem direito a cada tipo de certificado numa edição, e o snapshot dos
// marcadores (Certificado.dados) de cada um. Cada item devolvido tem a chave
// que identifica o certificado entre uma geração e outra (ver
// Certificado.chave no schema).

const CAMPOS_EDICAO = {
  id: true,
  nome: true,
  numero: true,
  dataInicio: true,
  dataFim: true,
  local: true,
  cidade: true,
  estado: true,
  cargaHorariaTotal: true,
};

const CAMPOS_USUARIO = {
  id: true,
  nome: true,
  cpf: true,
  documentoEstrangeiro: true,
  pais: true,
  ativo: true,
  anonimizadoEm: true,
};

// Mesmo critério da lista pública de aprovados (publico.controller.js):
// ressalvas/formatação só com a correção concluída.
const FILTRO_APROVADO = [
  { decisaoFinal: "APROVADO" },
  { decisaoFinal: { in: ["APROVADO_COM_RESSALVAS", "APROVADO_FORMATACAO"] }, statusCorrecao: "CONCLUIDA" },
];

const chaveUsuario = (usuarioId) => `u:${usuarioId}`;
const chavePresenca = (usuarioId, atividadeId) => `u:${usuarioId}:a:${atividadeId}`;
const chaveAutoria = (submissaoAutorId) => `sa:${submissaoAutorId}`;
const chaveAtuacao = (atividadePessoaId) => `ap:${atividadePessoaId}`;
const chaveEquipe = (membroEquipeId) => `me:${membroEquipeId}`;

function contaValida(usuario) {
  return Boolean(usuario && usuario.ativo && !usuario.anonimizadoEm);
}

function dadosEdicao(edicao) {
  return {
    edicao: edicao.nome,
    numeroEdicao: romano(edicao.numero),
    periodoEvento: formatarPeriodo(edicao.dataInicio, edicao.dataFim),
    local: edicao.local || "",
    cidade: [edicao.cidade, edicao.estado].filter(Boolean).join("/"),
  };
}

function dadosPessoa(usuario, nomeAlternativo = "") {
  return { nome: usuario?.nome || nomeAlternativo, documento: formatarDocumento(usuario) };
}

function dadosAtividade(atividade) {
  return {
    atividade: atividade.nome,
    tipoAtividade: atividade.tipoAtividade?.nome || "",
    dataAtividade: formatarPeriodo(atividade.inicioAtividade, atividade.fimAtividade),
  };
}

const INCLUDE_ATIVIDADE = {
  select: { id: true, nome: true, cargaHoraria: true, inicioAtividade: true, fimAtividade: true, tipoAtividade: { select: { nome: true } } },
};

// ---------------------------------------------------------------------------
// Por tipo
// ---------------------------------------------------------------------------

async function participacaoEvento(db, edicao) {
  const inscricoes = await db.inscricaoEdicao.findMany({
    where: { edicaoId: edicao.id, credenciadoEm: { not: null } },
    select: { usuario: { select: CAMPOS_USUARIO } },
  });
  return inscricoes
    .filter((i) => contaValida(i.usuario))
    .map(({ usuario }) => itemParticipacao(edicao, usuario));
}

function itemParticipacao(edicao, usuario) {
  return {
    chave: chaveUsuario(usuario.id),
    usuarioId: usuario.id,
    dados: { ...dadosEdicao(edicao), ...dadosPessoa(usuario), cargaHoraria: edicao.cargaHorariaTotal ?? null },
  };
}

async function presencaAtividade(db, edicao) {
  const inscricoes = await db.inscricaoAtividade.findMany({
    where: { atividade: { edicaoId: edicao.id }, presencaEm: { not: null } },
    select: { usuario: { select: CAMPOS_USUARIO }, atividade: INCLUDE_ATIVIDADE },
  });
  return inscricoes
    .filter((i) => contaValida(i.usuario))
    .map(({ usuario, atividade }) => itemPresenca(edicao, usuario, atividade));
}

function itemPresenca(edicao, usuario, atividade) {
  return {
    chave: chavePresenca(usuario.id, atividade.id),
    usuarioId: usuario.id,
    atividadeId: atividade.id,
    dados: {
      ...dadosEdicao(edicao),
      ...dadosPessoa(usuario),
      ...dadosAtividade(atividade),
      cargaHoraria: atividade.cargaHoraria ?? null,
    },
  };
}

// Um certificado por autor/coautor de trabalho aprovado e já vinculado a uma
// atividade de apresentação — inclusive quem não tem conta (fica sem
// usuarioId até se cadastrar; a autoria é associada pelo e-mail).
async function apresentacaoTrabalho(db, edicao) {
  const submissoes = await db.submissao.findMany({
    where: { edicaoId: edicao.id, atividadeApresentacaoId: { not: null }, OR: FILTRO_APROVADO },
    select: {
      titulo: true,
      modalidadeSubmissao: { select: { nome: true } },
      areaSubmissao: { select: { titulo: true } },
      atividadeApresentacao: INCLUDE_ATIVIDADE,
      autores: {
        select: { id: true, nome: true, usuario: { select: CAMPOS_USUARIO } },
        orderBy: { ordem: "asc" },
      },
    },
  });

  const itens = [];
  for (const submissao of submissoes) {
    const autores = juntarLista(submissao.autores.map((a) => (contaValida(a.usuario) ? a.usuario.nome : a.nome)));
    for (const autor of submissao.autores) {
      if (autor.usuario && !contaValida(autor.usuario)) continue;
      const usuario = autor.usuario || null;
      itens.push({
        chave: chaveAutoria(autor.id),
        usuarioId: usuario?.id || null,
        submissaoAutorId: autor.id,
        atividadeId: submissao.atividadeApresentacao.id,
        dados: {
          ...dadosEdicao(edicao),
          ...dadosPessoa(usuario, autor.nome),
          titulo: submissao.titulo,
          autores,
          modalidade: submissao.modalidadeSubmissao?.nome || "",
          area: submissao.areaSubmissao?.titulo || "",
          atividade: submissao.atividadeApresentacao.nome,
          cargaHoraria: submissao.atividadeApresentacao.cargaHoraria ?? null,
        },
      });
    }
  }
  return itens;
}

// Só quem registrou ao menos uma decisão.
async function avaliador(db, edicao, { usuarioId } = {}) {
  const avaliadores = await db.avaliadorEdicao.findMany({
    where: { edicaoId: edicao.id, ...(usuarioId ? { usuarioId } : {}) },
    select: {
      usuario: { select: CAMPOS_USUARIO },
      areas: { select: { titulo: true }, orderBy: { ordem: "asc" } },
      _count: { select: { atribuicoes: { where: { decisao: { not: null } } } } },
    },
  });
  return avaliadores
    .filter((a) => contaValida(a.usuario) && (usuarioId || a._count.atribuicoes > 0))
    .map((a) => itemAvaliador(edicao, a.usuario, a));
}

function itemAvaliador(edicao, usuario, vinculo) {
  return {
    chave: chaveUsuario(usuario.id),
    usuarioId: usuario.id,
    dados: {
      ...dadosEdicao(edicao),
      ...dadosPessoa(usuario),
      trabalhosAvaliados: String(vinculo?._count?.atribuicoes ?? 0),
      areas: juntarLista((vinculo?.areas || []).map((a) => a.titulo)),
      cargaHoraria: null,
    },
  };
}

async function monitor(db, edicao) {
  const inscricoes = await db.inscricaoMonitoria.findMany({
    where: { edicaoId: edicao.id, status: "SELECIONADO" },
    select: { funcoes: true, usuario: { select: CAMPOS_USUARIO } },
  });
  return inscricoes.filter((i) => contaValida(i.usuario)).map((i) => itemMonitor(edicao, i.usuario, i.funcoes));
}

function itemMonitor(edicao, usuario, funcoes) {
  return {
    chave: chaveUsuario(usuario.id),
    usuarioId: usuario.id,
    dados: { ...dadosEdicao(edicao), ...dadosPessoa(usuario), funcoes: juntarLista(funcoes || []), cargaHoraria: null },
  };
}

// Pessoas envolvidas nas atividades (palestrante, mediador…): um certificado
// por pessoa por atividade, com ou sem conta — sem conta fica sem usuarioId
// até alguém se cadastrar com o e-mail informado (como as autorias). O nome é
// o cadastrado na atividade (é o que a organização revisou), o documento vem
// da conta, quando houver.
async function atuacaoAtividade(db, edicao) {
  const pessoas = await db.atividadePessoa.findMany({
    where: { atividade: { edicaoId: edicao.id } },
    select: {
      id: true,
      nome: true,
      usuario: { select: CAMPOS_USUARIO },
      tipoParticipacao: { select: { nome: true } },
      atividade: INCLUDE_ATIVIDADE,
    },
    orderBy: [{ atividade: { inicioAtividade: "asc" } }, { ordem: "asc" }],
  });
  return pessoas
    .filter((p) => !p.usuario || contaValida(p.usuario))
    .map((p) => ({
      chave: chaveAtuacao(p.id),
      usuarioId: p.usuario?.id || null,
      atividadePessoaId: p.id,
      atividadeId: p.atividade.id,
      dados: {
        ...dadosEdicao(edicao),
        nome: p.nome,
        documento: formatarDocumento(p.usuario),
        ...dadosAtividade(p.atividade),
        funcao: p.tipoParticipacao?.nome || "",
        cargaHoraria: p.atividade.cargaHoraria ?? null,
      },
    }));
}

// Equipe do evento (MembroEquipe), cadastrada na tela de Certificados.
async function equipeEvento(db, edicao) {
  const membros = await db.membroEquipe.findMany({
    where: { edicaoId: edicao.id },
    select: { id: true, nome: true, funcao: true, cargaHoraria: true, usuario: { select: CAMPOS_USUARIO } },
    orderBy: [{ funcao: "asc" }, { nome: "asc" }],
  });
  return membros
    .filter((m) => !m.usuario || contaValida(m.usuario))
    .map((m) => ({
      chave: chaveEquipe(m.id),
      usuarioId: m.usuario?.id || null,
      membroEquipeId: m.id,
      dados: {
        ...dadosEdicao(edicao),
        nome: m.nome,
        documento: formatarDocumento(m.usuario),
        funcao: m.funcao,
        cargaHoraria: m.cargaHoraria ?? null,
      },
    }));
}

const POR_TIPO = {
  PARTICIPACAO_EVENTO: participacaoEvento,
  PRESENCA_ATIVIDADE: presencaAtividade,
  APRESENTACAO_TRABALHO: apresentacaoTrabalho,
  AVALIADOR: avaliador,
  MONITOR: monitor,
  ATUACAO_ATIVIDADE: atuacaoAtividade,
  EQUIPE_EVENTO: equipeEvento,
};

async function listarElegiveis(db, edicao, tipo) {
  return POR_TIPO[tipo](db, edicao);
}

// Inclusão manual pela organização (fora da regra): monta o mesmo snapshot
// com o que houver de dado — ex. avaliador sem decisão registrada.
async function montarItemManual(db, edicao, tipo, usuario, atividade) {
  switch (tipo) {
    case "PARTICIPACAO_EVENTO":
      return itemParticipacao(edicao, usuario);
    case "PRESENCA_ATIVIDADE":
      return itemPresenca(edicao, usuario, atividade);
    case "AVALIADOR": {
      const [existente] = await avaliador(db, edicao, { usuarioId: usuario.id });
      return existente || itemAvaliador(edicao, usuario, null);
    }
    case "MONITOR": {
      const inscricao = await db.inscricaoMonitoria.findUnique({
        where: { usuarioId_edicaoId: { usuarioId: usuario.id, edicaoId: edicao.id } },
        select: { funcoes: true },
      });
      return itemMonitor(edicao, usuario, inscricao?.funcoes);
    }
    default:
      return null;
  }
}

module.exports = {
  CAMPOS_EDICAO,
  CAMPOS_USUARIO,
  INCLUDE_ATIVIDADE,
  listarElegiveis,
  montarItemManual,
  contaValida,
  dadosEdicao,
  chaveUsuario,
  chavePresenca,
};
