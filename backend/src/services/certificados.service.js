const crypto = require("crypto");
const sharp = require("sharp");
const prisma = require("../config/prisma");
const env = require("../config/env");
const ErroHttp = require("../utils/erroHttp");
const storageService = require("./storage.service");
const sanitizarTextoCertificado = require("../utils/sanitizarTextoCertificado");
const {
  MARCADORES_POR_TIPO,
  marcadoresDesconhecidos,
  formatarDataLongaBrasilia,
} = require("../utils/marcadoresCertificado");
const {
  CAMPOS_EDICAO,
  listarElegiveis,
  montarItemManual,
  contaValida,
  dadosEdicao,
  chaveUsuario,
  chavePresenca,
} = require("./certificadosElegiveis");
const { gerarPdfCertificado } = require("./pdfCertificado.service");
const emailService = require("./email.service");
const { camposContaPorEmail } = require("./atividades.service");
const escaparHtml = require("../utils/escaparHtml");

// Certificados de uma edição (seção CERTIFICADOS do admin). A organização
// configura um modelo por tipo (fundo, texto com marcadores, margens, QR),
// gera os certificados de quem tem direito (certificadosElegiveis.js), revisa,
// inclui/revoga manualmente e libera o tipo — só então o participante baixa o
// PDF na área dele. Cada certificado tem um código público validado em
// /validar-certificado/<codigo> (QR code impresso no PDF).

const TIPOS = [
  "PARTICIPACAO_EVENTO",
  "PRESENCA_ATIVIDADE",
  "APRESENTACAO_TRABALHO",
  "AVALIADOR",
  "MONITOR",
  "ATUACAO_ATIVIDADE",
  "EQUIPE_EVENTO",
];

const ROTULOS_TIPO = {
  PARTICIPACAO_EVENTO: "Participação no evento",
  PRESENCA_ATIVIDADE: "Presença em atividade",
  APRESENTACAO_TRABALHO: "Apresentação de trabalho",
  AVALIADOR: "Avaliação de trabalhos",
  MONITOR: "Monitoria",
  ATUACAO_ATIVIDADE: "Atuação em atividade",
  EQUIPE_EVENTO: "Equipe do evento",
};

const TEXTOS_PADRAO = {
  PARTICIPACAO_EVENTO:
    "<p>Certificamos que <strong>{{nome}}</strong> participou do {{edicao}}, realizado {{periodoEvento}}, com carga horária de {{cargaHoraria}} horas.</p>",
  PRESENCA_ATIVIDADE:
    "<p>Certificamos que <strong>{{nome}}</strong> participou da atividade <em>{{atividade}}</em>, realizada {{dataAtividade}}, no {{edicao}}, com carga horária de {{cargaHoraria}} horas.</p>",
  APRESENTACAO_TRABALHO:
    "<p>Certificamos que <strong>{{nome}}</strong> apresentou o trabalho <em>{{titulo}}</em>, de autoria de {{autores}}, na modalidade {{modalidade}}, durante o {{edicao}}, realizado {{periodoEvento}}.</p>",
  AVALIADOR:
    "<p>Certificamos que <strong>{{nome}}</strong> atuou como avaliador(a) dos trabalhos submetidos ao {{edicao}}, tendo avaliado {{trabalhosAvaliados}} trabalho(s).</p>",
  MONITOR:
    "<p>Certificamos que <strong>{{nome}}</strong> atuou como monitor(a) voluntário(a) do {{edicao}}, realizado {{periodoEvento}}, com carga horária de {{cargaHoraria}} horas.</p>",
  ATUACAO_ATIVIDADE:
    "<p>Certificamos que <strong>{{nome}}</strong> atuou como {{funcao}} na atividade <em>{{atividade}}</em>, realizada {{dataAtividade}}, no {{edicao}}, com carga horária de {{cargaHoraria}} horas.</p>",
  EQUIPE_EVENTO:
    "<p>Certificamos que <strong>{{nome}}</strong> integrou a {{funcao}} do {{edicao}}, realizado {{periodoEvento}}, com carga horária de {{cargaHoraria}} horas.</p>",
};

const CAMPOS_LAYOUT = [
  "margemSuperior",
  "margemInferior",
  "margemEsquerda",
  "margemDireita",
  "alinhamento",
  "alinhamentoVertical",
  "fonte",
  "tamanhoFonte",
  "entrelinha",
  "corTexto",
  "posicaoQr",
  "tamanhoQr",
  "margemQr",
  "cargaHoraria",
];

function modeloPadrao(tipo) {
  return {
    id: null,
    tipo,
    imagemFundo: null,
    larguraFundo: null,
    alturaFundo: null,
    texto: TEXTOS_PADRAO[tipo],
    margemSuperior: 62,
    margemInferior: 45,
    margemEsquerda: 40,
    margemDireita: 40,
    alinhamento: "CENTRO",
    alinhamentoVertical: "CENTRO",
    fonte: "ARCHIVO",
    tamanhoFonte: 16,
    entrelinha: 1.4,
    corTexto: "#2B2622",
    posicaoQr: "INFERIOR_DIREITO",
    tamanhoQr: 24,
    margemQr: 12,
    cargaHoraria: null,
    liberadoEm: null,
    updatedAt: null,
  };
}

function projetarModelo(modelo) {
  const { edicaoId, ...resto } = modelo;
  return { ...resto, salvo: Boolean(modelo.id) };
}

// ---------------------------------------------------------------------------
// Código de validação: 12 caracteres de um alfabeto de 32 sem os ambíguos
// (0/O, 1/I), exibido em grupos de 4. 256 é múltiplo de 32, então sem viés.
// ---------------------------------------------------------------------------

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function gerarCodigo() {
  return Array.from(crypto.randomBytes(12), (byte) => ALFABETO[byte % ALFABETO.length]).join("");
}

function formatarCodigo(codigo) {
  return codigo.match(/.{1,4}/g).join("-");
}

function normalizarCodigo(entrada) {
  return String(entrada || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function urlValidacao(codigo) {
  return `${env.frontendUrl}/validar-certificado/${codigo}`;
}

async function gerarCodigosUnicos(db, quantidade) {
  const codigos = new Set();
  while (codigos.size < quantidade) {
    const faltam = quantidade - codigos.size;
    const candidatos = Array.from({ length: faltam }, gerarCodigo).filter((c) => !codigos.has(c));
    const emUso = await db.certificado.findMany({ where: { codigo: { in: candidatos } }, select: { codigo: true } });
    const ocupados = new Set(emUso.map((c) => c.codigo));
    candidatos.filter((c) => !ocupados.has(c)).forEach((c) => codigos.add(c));
  }
  return [...codigos];
}

// ---------------------------------------------------------------------------
// Imagem de fundo
// ---------------------------------------------------------------------------

const PASTA_FUNDOS = "certificados-fundos";
// A4 a 300 dpi no lado maior — acima disso não melhora a impressão.
const DIMENSAO_MAX_FUNDO = 3508;

// Normaliza qualquer PNG/JPEG enviado pra JPEG (sem transparência, fundo
// branco), girado pelo EXIF e limitado a 3508 px.
async function normalizarFundo(buffer) {
  try {
    const { data, info } = await sharp(buffer)
      .rotate()
      .resize({ width: DIMENSAO_MAX_FUNDO, height: DIMENSAO_MAX_FUNDO, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    return { buffer: data, largura: info.width, altura: info.height };
  } catch {
    throw new ErroHttp(400, "Não foi possível ler a imagem de fundo. Envie um arquivo PNG ou JPG válido.");
  }
}

// Cache pequeno em memória: o mesmo fundo é usado em centenas de PDFs.
const CACHE_FUNDOS_MAX = 6;
const cacheFundos = new Map();

async function carregarFundo(url) {
  if (!url) return null;
  if (cacheFundos.has(url)) {
    const buffer = cacheFundos.get(url);
    cacheFundos.delete(url);
    cacheFundos.set(url, buffer);
    return buffer;
  }
  const buffer = await storageService.lerArquivoPublico(url);
  cacheFundos.set(url, buffer);
  if (cacheFundos.size > CACHE_FUNDOS_MAX) cacheFundos.delete(cacheFundos.keys().next().value);
  return buffer;
}

// Vários tipos podem apontar pro mesmo arquivo ("Copiar layout").
async function removerFundoSeSemUso(url) {
  if (!url) return;
  const emUso = await prisma.modeloCertificado.count({ where: { imagemFundo: url } });
  if (emUso > 0) return;
  cacheFundos.delete(url);
  await storageService.removerImagemPublica(url).catch((erro) => {
    console.error("[certificados] Falha ao remover fundo antigo:", erro.message);
  });
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

async function buscarEdicao(edicaoId, db = prisma) {
  const edicao = await db.edicao.findUnique({ where: { id: edicaoId }, select: CAMPOS_EDICAO });
  if (!edicao) throw new ErroHttp(404, "Edição não encontrada.");
  return edicao;
}

function exigirTipo(tipo) {
  if (!TIPOS.includes(tipo)) throw new ErroHttp(404, "Tipo de certificado não encontrado.");
}

async function modelosDaEdicao(edicaoId, db = prisma) {
  const salvos = await db.modeloCertificado.findMany({ where: { edicaoId } });
  const porTipo = new Map(salvos.map((m) => [m.tipo, m]));
  return Object.fromEntries(TIPOS.map((tipo) => [tipo, porTipo.get(tipo) || modeloPadrao(tipo)]));
}

async function modeloDoTipo(edicaoId, tipo, db = prisma) {
  const salvo = await db.modeloCertificado.findUnique({ where: { edicaoId_tipo: { edicaoId, tipo } } });
  return salvo || modeloPadrao(tipo);
}

function cargaHorariaDe(modelo, dados) {
  return modelo?.cargaHoraria ?? dados?.cargaHoraria ?? null;
}

// O que identifica o certificado além do nome (atividade ou trabalho).
function referenciaDe(certificado) {
  const dados = certificado.dados || {};
  if (certificado.tipo === "APRESENTACAO_TRABALHO") return dados.titulo || "";
  if (certificado.tipo === "PRESENCA_ATIVIDADE") return dados.atividade || "";
  if (certificado.tipo === "ATUACAO_ATIVIDADE") {
    return [dados.funcao, dados.atividade].filter(Boolean).join(" — ");
  }
  if (certificado.tipo === "EQUIPE_EVENTO") return dados.funcao || "";
  return "";
}

// Valores de exemplo da prévia (admin), com os dados reais da edição.
function valoresExemplo(edicao, tipo, modelo) {
  return {
    ...dadosEdicao(edicao),
    nome: "Maria da Silva Santos",
    documento: "123.456.789-00",
    cargaHoraria: String(modelo.cargaHoraria ?? (tipo === "PARTICIPACAO_EVENTO" ? edicao.cargaHorariaTotal ?? 20 : 4)),
    dataEmissao: formatarDataLongaBrasilia(new Date()),
    codigo: "ABCD-EFGH-JKMN",
    atividade: "Oficina de narrativas decoloniais",
    tipoAtividade: "Oficina",
    dataAtividade: "em 11 de novembro de 2026",
    titulo: "Título de exemplo do trabalho apresentado",
    autores: "Maria da Silva Santos, João Pereira e Ana Lima",
    modalidade: "Conversatórios",
    area: "Educação e relações étnico-raciais",
    trabalhosAvaliados: "5",
    areas: "Educação e relações étnico-raciais",
    funcoes: "Credenciamento e Apoio às atividades",
    funcao: tipo === "EQUIPE_EVENTO" ? "Comissão Organizadora" : "Mediadora",
  };
}

function valoresDoCertificado(certificado, modelo) {
  const carga = cargaHorariaDe(modelo, certificado.dados);
  return {
    ...certificado.dados,
    cargaHoraria: carga == null ? "" : String(carga),
    codigo: formatarCodigo(certificado.codigo),
    dataEmissao: formatarDataLongaBrasilia(certificado.emitidoEm),
  };
}

// Para onde vai o certificado por e-mail: a conta ligada, senão o e-mail
// solto da autoria / convidado / membro da equipe.
const SELECT_DESTINO = {
  usuario: { select: { email: true, ativo: true, anonimizadoEm: true } },
  submissaoAutor: { select: { email: true } },
  atividadePessoa: { select: { email: true } },
  membroEquipe: { select: { email: true } },
};

function emailDestino(certificado) {
  if (certificado.usuario) return contaValida(certificado.usuario) ? certificado.usuario.email : null;
  return (
    certificado.submissaoAutor?.email || certificado.atividadePessoa?.email || certificado.membroEquipe?.email || null
  );
}

function situacaoEmail(certificado) {
  if (certificado.emailEnviadoEm) return "ENVIADO";
  if (certificado.emailErro) return "ERRO";
  if (certificado.emailSolicitadoEm) return "PENDENTE";
  return "NAO_ENVIADO";
}

async function listar(edicaoId) {
  const edicao = await buscarEdicao(edicaoId);
  const [modelos, certificados, elegiveisPorTipo, atividades, equipe, convidados] = await Promise.all([
    modelosDaEdicao(edicaoId),
    prisma.certificado.findMany({
      where: { edicaoId },
      select: {
        id: true,
        tipo: true,
        chave: true,
        codigo: true,
        origem: true,
        dados: true,
        revogadoEm: true,
        motivoRevogacao: true,
        emitidoEm: true,
        emailSolicitadoEm: true,
        emailEnviadoEm: true,
        emailErro: true,
        ...SELECT_DESTINO,
      },
      orderBy: { emitidoEm: "desc" },
    }),
    Promise.all(TIPOS.map((tipo) => listarElegiveis(prisma, edicao, tipo))),
    // Pra inclusão manual de presença.
    prisma.atividade.findMany({ where: { edicaoId }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    listarEquipe(edicaoId),
    listarConvidados(edicaoId),
  ]);

  const chavesElegiveis = Object.fromEntries(
    TIPOS.map((tipo, i) => [tipo, new Set(elegiveisPorTipo[i].map((item) => item.chave))])
  );

  const resumo = Object.fromEntries(
    TIPOS.map((tipo) => {
      const doTipo = certificados.filter((c) => c.tipo === tipo);
      const chavesEmitidas = new Set(doTipo.map((c) => c.chave));
      const ativos = doTipo.filter((c) => !c.revogadoEm);
      return [
        tipo,
        {
          elegiveis: chavesElegiveis[tipo].size,
          novos: [...chavesElegiveis[tipo]].filter((chave) => !chavesEmitidas.has(chave)).length,
          emitidos: ativos.length,
          revogados: doTipo.length - ativos.length,
          foraDaRegra: ativos.filter((c) => c.origem === "REGRA" && !chavesElegiveis[tipo].has(c.chave)).length,
        },
      ];
    })
  );

  return {
    edicao: { id: edicao.id, nome: edicao.nome },
    tipos: TIPOS.map((tipo) => ({ tipo, rotulo: ROTULOS_TIPO[tipo] })),
    atividades,
    modelos: Object.fromEntries(TIPOS.map((tipo) => [tipo, projetarModelo(modelos[tipo])])),
    marcadores: MARCADORES_POR_TIPO,
    exemplos: Object.fromEntries(TIPOS.map((tipo) => [tipo, valoresExemplo(edicao, tipo, modelos[tipo])])),
    resumo,
    equipe,
    convidados,
    envioEmail: {
      enviando: enviosEmAndamento.has(edicaoId),
      pendentes: certificados.filter((c) => situacaoEmail(c) === "PENDENTE" && !c.revogadoEm).length,
      comErro: certificados.filter((c) => situacaoEmail(c) === "ERRO" && !c.revogadoEm).length,
    },
    certificados: certificados.map((c) => ({
      id: c.id,
      tipo: c.tipo,
      codigo: formatarCodigo(c.codigo),
      nome: c.dados?.nome || "",
      email: emailDestino(c),
      situacaoEmail: situacaoEmail(c),
      emailEnviadoEm: c.emailEnviadoEm,
      emailErro: c.emailErro,
      referencia: referenciaDe(c),
      cargaHoraria: cargaHorariaDe(modelos[c.tipo], c.dados),
      origem: c.origem,
      revogadoEm: c.revogadoEm,
      motivoRevogacao: c.motivoRevogacao,
      emitidoEm: c.emitidoEm,
      liberado: Boolean(modelos[c.tipo].liberadoEm),
      foraDaRegra: c.origem === "REGRA" && !c.revogadoEm && !chavesElegiveis[c.tipo].has(c.chave),
    })),
  };
}

// ---------------------------------------------------------------------------
// Modelo
// ---------------------------------------------------------------------------

function validarTexto(tipo, texto) {
  const desconhecidos = marcadoresDesconhecidos(tipo, texto);
  if (desconhecidos.length > 0) {
    const lista = desconhecidos.map((m) => `{{${m}}}`).join(", ");
    throw new ErroHttp(
      400,
      desconhecidos.length === 1
        ? `O campo ${lista} não existe para este tipo de certificado.`
        : `Os campos ${lista} não existem para este tipo de certificado.`
    );
  }
  const sanitizado = sanitizarTextoCertificado(texto);
  if (!sanitizado) throw new ErroHttp(400, "Escreva o texto do certificado.");
  return sanitizado;
}

async function salvarModelo(edicaoId, tipo, corpo) {
  exigirTipo(tipo);
  await buscarEdicao(edicaoId);
  const texto = validarTexto(tipo, corpo.texto);
  const atual = await prisma.modeloCertificado.findUnique({ where: { edicaoId_tipo: { edicaoId, tipo } } });

  let imagem = {
    imagemFundo: atual?.imagemFundo ?? null,
    larguraFundo: atual?.larguraFundo ?? null,
    alturaFundo: atual?.alturaFundo ?? null,
  };
  let arquivoNovo = null;

  if (corpo.imagemFundo === null) {
    imagem = { imagemFundo: null, larguraFundo: null, alturaFundo: null };
  } else if (typeof corpo.imagemFundo === "string" && corpo.imagemFundo.startsWith("data:")) {
    const { buffer } = storageService.decodificarDataUri(corpo.imagemFundo);
    const normalizado = await normalizarFundo(buffer);
    arquivoNovo = await storageService.salvarBufferPublico(normalizado.buffer, "image/jpeg", "jpg", PASTA_FUNDOS);
    imagem = { imagemFundo: arquivoNovo, larguraFundo: normalizado.largura, alturaFundo: normalizado.altura };
  } else if (typeof corpo.imagemFundo === "string" && corpo.imagemFundo !== atual?.imagemFundo) {
    // URL só vale se for o fundo de outro tipo da mesma edição (Copiar layout).
    const origem = await prisma.modeloCertificado.findFirst({
      where: { edicaoId, imagemFundo: corpo.imagemFundo },
      select: { imagemFundo: true, larguraFundo: true, alturaFundo: true },
    });
    if (!origem) throw new ErroHttp(400, "Imagem de fundo inválida. Envie o arquivo novamente.");
    imagem = origem;
  }

  const dados = { texto, ...imagem };
  for (const campo of CAMPOS_LAYOUT) {
    if (corpo[campo] !== undefined) dados[campo] = corpo[campo];
  }

  let modelo;
  try {
    modelo = await prisma.modeloCertificado.upsert({
      where: { edicaoId_tipo: { edicaoId, tipo } },
      create: { ...modeloSemMeta(modeloPadrao(tipo)), ...dados, edicaoId, tipo },
      update: dados,
    });
  } catch (erro) {
    if (arquivoNovo) await storageService.removerImagemPublica(arquivoNovo).catch(() => {});
    throw erro;
  }

  if (atual?.imagemFundo && atual.imagemFundo !== modelo.imagemFundo) {
    await removerFundoSeSemUso(atual.imagemFundo);
  }
  return projetarModelo(modelo);
}

function modeloSemMeta(modelo) {
  const { id, tipo, liberadoEm, updatedAt, ...resto } = modelo;
  return resto;
}

// PDF de exemplo com o modelo ainda não salvo (o que está no formulário).
async function previa(edicaoId, tipo, corpo) {
  exigirTipo(tipo);
  const edicao = await buscarEdicao(edicaoId);
  const atual = await modeloDoTipo(edicaoId, tipo);

  let imagemFundo = null;
  if (typeof corpo.imagemFundo === "string" && corpo.imagemFundo.startsWith("data:")) {
    imagemFundo = (await normalizarFundo(storageService.decodificarDataUri(corpo.imagemFundo).buffer)).buffer;
  } else if (typeof corpo.imagemFundo === "string" && storageService.ehUrlPublica(corpo.imagemFundo)) {
    imagemFundo = await carregarFundo(corpo.imagemFundo);
  } else if (corpo.imagemFundo === undefined && atual.imagemFundo) {
    imagemFundo = await carregarFundo(atual.imagemFundo);
  }

  const modelo = { ...atual, ...corpo, texto: sanitizarTextoCertificado(corpo.texto) };
  const valores = valoresExemplo(edicao, tipo, modelo);
  return gerarPdfCertificado({
    modelo,
    valores,
    codigo: valores.codigo,
    urlValidacao: urlValidacao("ABCDEFGHJKMN"),
    imagemFundo,
    titulo: `Prévia — ${ROTULOS_TIPO[tipo]}`,
  });
}

async function definirLiberacao(edicaoId, tipo, liberado) {
  exigirTipo(tipo);
  await buscarEdicao(edicaoId);
  const modelo = await prisma.modeloCertificado.findUnique({ where: { edicaoId_tipo: { edicaoId, tipo } } });
  if (!modelo) throw new ErroHttp(409, "Salve o modelo deste tipo antes de liberar os certificados.");
  const atualizado = await prisma.modeloCertificado.update({
    where: { id: modelo.id },
    data: { liberadoEm: liberado ? modelo.liberadoEm || new Date() : null },
  });
  return projetarModelo(atualizado);
}

// ---------------------------------------------------------------------------
// Emissão
// ---------------------------------------------------------------------------

// Cria os certificados de quem tem direito e ainda não tem, e atualiza o
// snapshot dos já emitidos (não revogados). Revogados continuam revogados;
// quem deixou de ter direito não é apagado — aparece como "fora da regra".
async function gerar(edicaoId, tipo) {
  exigirTipo(tipo);
  const edicao = await buscarEdicao(edicaoId);
  const elegiveis = await listarElegiveis(prisma, edicao, tipo);

  return prisma.$transaction(
    async (tx) => {
      const existentes = await tx.certificado.findMany({
        where: { edicaoId, tipo },
        select: { id: true, chave: true, revogadoEm: true, dados: true, usuarioId: true },
      });
      const porChave = new Map(existentes.map((c) => [c.chave, c]));

      const novos = [];
      let atualizados = 0;
      for (const item of elegiveis) {
        const atual = porChave.get(item.chave);
        if (!atual) {
          novos.push(item);
          continue;
        }
        if (atual.revogadoEm) continue;
        const mudou =
          JSON.stringify(atual.dados) !== JSON.stringify(item.dados) || atual.usuarioId !== (item.usuarioId ?? null);
        if (mudou) {
          await tx.certificado.update({
            where: { id: atual.id },
            data: { dados: item.dados, usuarioId: item.usuarioId ?? null },
          });
          atualizados += 1;
        }
      }

      if (novos.length > 0) {
        const codigos = await gerarCodigosUnicos(tx, novos.length);
        await tx.certificado.createMany({
          data: novos.map((item, i) => ({
            edicaoId,
            tipo,
            chave: item.chave,
            codigo: codigos[i],
            usuarioId: item.usuarioId ?? null,
            submissaoAutorId: item.submissaoAutorId ?? null,
            atividadePessoaId: item.atividadePessoaId ?? null,
            membroEquipeId: item.membroEquipeId ?? null,
            atividadeId: item.atividadeId ?? null,
            origem: "REGRA",
            dados: item.dados,
          })),
        });
      }
      return { criados: novos.length, atualizados };
    },
    { timeout: 60000 }
  );
}

async function incluirManual(edicaoId, { tipo, usuarioId, atividadeId }) {
  const edicao = await buscarEdicao(edicaoId);
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { id: true, nome: true, cpf: true, documentoEstrangeiro: true, pais: true, ativo: true, anonimizadoEm: true },
  });
  if (!contaValida(usuario)) throw new ErroHttp(404, "Usuário não encontrado.");

  let atividade = null;
  if (tipo === "PRESENCA_ATIVIDADE") {
    if (!atividadeId) throw new ErroHttp(400, "Escolha a atividade.");
    atividade = await prisma.atividade.findFirst({
      where: { id: atividadeId, edicaoId },
      select: {
        id: true,
        nome: true,
        cargaHoraria: true,
        inicioAtividade: true,
        fimAtividade: true,
        tipoAtividade: { select: { nome: true } },
      },
    });
    if (!atividade) throw new ErroHttp(404, "Atividade não encontrada nesta edição.");
  }

  const chave = tipo === "PRESENCA_ATIVIDADE" ? chavePresenca(usuario.id, atividade.id) : chaveUsuario(usuario.id);
  const existente = await prisma.certificado.findUnique({
    where: { edicaoId_tipo_chave: { edicaoId, tipo, chave } },
    select: { revogadoEm: true },
  });
  if (existente) {
    throw new ErroHttp(
      409,
      existente.revogadoEm
        ? "Essa pessoa já tem este certificado, revogado. Restaure-o na lista em vez de incluir de novo."
        : "Essa pessoa já tem este certificado."
    );
  }

  const item = await montarItemManual(prisma, edicao, tipo, usuario, atividade);
  const [codigo] = await gerarCodigosUnicos(prisma, 1);
  await prisma.certificado.create({
    data: {
      edicaoId,
      tipo,
      chave,
      codigo,
      usuarioId: usuario.id,
      atividadeId: atividade?.id ?? null,
      origem: "MANUAL",
      dados: item.dados,
    },
  });
}

async function buscarDaEdicao(edicaoId, id) {
  const certificado = await prisma.certificado.findFirst({ where: { id, edicaoId } });
  if (!certificado) throw new ErroHttp(404, "Certificado não encontrado.");
  return certificado;
}

async function revogar(edicaoId, id, motivo) {
  const certificado = await buscarDaEdicao(edicaoId, id);
  if (certificado.revogadoEm) throw new ErroHttp(409, "Este certificado já está revogado.");
  await prisma.certificado.update({
    where: { id },
    data: { revogadoEm: new Date(), motivoRevogacao: motivo || null },
  });
}

async function restaurar(edicaoId, id) {
  const certificado = await buscarDaEdicao(edicaoId, id);
  if (!certificado.revogadoEm) throw new ErroHttp(409, "Este certificado não está revogado.");
  await prisma.certificado.update({ where: { id }, data: { revogadoEm: null, motivoRevogacao: null } });
}

async function revogarEmLote(edicaoId, ids, motivo) {
  const { count } = await prisma.certificado.updateMany({
    where: { edicaoId, id: { in: ids }, revogadoEm: null },
    data: { revogadoEm: new Date(), motivoRevogacao: motivo || null },
  });
  return count;
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

async function montarPdf(certificado, modelo) {
  const valores = valoresDoCertificado(certificado, modelo);
  const buffer = await gerarPdfCertificado({
    modelo,
    valores,
    codigo: valores.codigo,
    urlValidacao: urlValidacao(certificado.codigo),
    imagemFundo: await carregarFundo(modelo.imagemFundo),
    titulo: `Certificado — ${ROTULOS_TIPO[certificado.tipo]} — ${valores.nome || ""}`,
  });
  return { buffer, nomeArquivo: `certificado-${valores.codigo}.pdf` };
}

// Admin baixa qualquer um (inclusive revogado ou ainda não liberado), pra
// conferência.
async function pdfAdmin(edicaoId, id) {
  const certificado = await buscarDaEdicao(edicaoId, id);
  return montarPdf(certificado, await modeloDoTipo(edicaoId, certificado.tipo));
}

// ---------------------------------------------------------------------------
// Participante
// ---------------------------------------------------------------------------

// Do participante: ligado à conta direto ou pela autoria (coautor que criou a
// conta depois da geração).
function filtroDoUsuario(usuarioId) {
  return {
    revogadoEm: null,
    OR: [
      { usuarioId },
      { submissaoAutor: { usuarioId } },
      { atividadePessoa: { usuarioId } },
      { membroEquipe: { usuarioId } },
    ],
  };
}

async function modelosLiberados(edicaoIds) {
  const modelos = await prisma.modeloCertificado.findMany({
    where: { edicaoId: { in: edicaoIds }, liberadoEm: { not: null } },
  });
  return new Map(modelos.map((m) => [`${m.edicaoId}:${m.tipo}`, m]));
}

async function listarDoParticipante(usuarioId) {
  const certificados = await prisma.certificado.findMany({
    where: filtroDoUsuario(usuarioId),
    select: {
      id: true,
      tipo: true,
      codigo: true,
      dados: true,
      emitidoEm: true,
      edicaoId: true,
      edicao: { select: { id: true, nome: true, numero: true } },
    },
    orderBy: { emitidoEm: "asc" },
  });
  const liberados = await modelosLiberados([...new Set(certificados.map((c) => c.edicaoId))]);

  return certificados
    .filter((c) => liberados.has(`${c.edicaoId}:${c.tipo}`))
    .map((c) => ({
      id: c.id,
      tipo: c.tipo,
      rotuloTipo: ROTULOS_TIPO[c.tipo],
      codigo: formatarCodigo(c.codigo),
      referencia: referenciaDe(c),
      cargaHoraria: cargaHorariaDe(liberados.get(`${c.edicaoId}:${c.tipo}`), c.dados),
      emitidoEm: c.emitidoEm,
      edicao: c.edicao,
    }))
    .sort((a, b) => b.edicao.numero - a.edicao.numero || TIPOS.indexOf(a.tipo) - TIPOS.indexOf(b.tipo));
}

async function pdfDoParticipante(usuarioId, id) {
  const certificado = await prisma.certificado.findFirst({ where: { id, ...filtroDoUsuario(usuarioId) } });
  if (!certificado) throw new ErroHttp(404, "Certificado não encontrado.");
  const modelo = (await modelosLiberados([certificado.edicaoId])).get(`${certificado.edicaoId}:${certificado.tipo}`);
  if (!modelo) throw new ErroHttp(404, "Certificado não encontrado.");
  return montarPdf(certificado, modelo);
}

// ---------------------------------------------------------------------------
// Validação pública
// ---------------------------------------------------------------------------

// Sem documento nem e-mail. Certificado de tipo ainda não liberado conta como
// inexistente (não foi entregue a ninguém); revogado aparece como revogado.
async function validar(codigoDigitado) {
  const codigo = normalizarCodigo(codigoDigitado);
  if (codigo.length !== 12) throw new ErroHttp(404, "Não encontramos certificado com esse código.");

  const certificado = await prisma.certificado.findUnique({
    where: { codigo },
    include: { edicao: { select: { nome: true } } },
  });
  if (!certificado) throw new ErroHttp(404, "Não encontramos certificado com esse código.");

  const modelo = await prisma.modeloCertificado.findUnique({
    where: { edicaoId_tipo: { edicaoId: certificado.edicaoId, tipo: certificado.tipo } },
  });
  if (!modelo?.liberadoEm && !certificado.revogadoEm) {
    throw new ErroHttp(404, "Não encontramos certificado com esse código.");
  }

  return {
    codigo: formatarCodigo(certificado.codigo),
    situacao: certificado.revogadoEm ? "REVOGADO" : "VALIDO",
    tipo: certificado.tipo,
    rotuloTipo: ROTULOS_TIPO[certificado.tipo],
    nome: certificado.dados?.nome || "",
    edicao: certificado.edicao.nome,
    referencia: referenciaDe(certificado),
    cargaHoraria: cargaHorariaDe(modelo, certificado.dados),
    emitidoEm: certificado.emitidoEm,
    revogadoEm: certificado.revogadoEm,
  };
}

// ---------------------------------------------------------------------------
// PDF pelo código (link do e-mail e botão da validação pública)
// ---------------------------------------------------------------------------

// Mesma regra da validação: só certificado válido de tipo liberado. O código
// já está impresso (e no QR) do próprio certificado, então o PDF não expõe
// nada além do que quem tem o código já tem em mãos.
async function pdfPublico(codigoDigitado) {
  const codigo = normalizarCodigo(codigoDigitado);
  const naoEncontrado = new ErroHttp(404, "Não encontramos certificado com esse código.");
  if (codigo.length !== 12) throw naoEncontrado;
  const certificado = await prisma.certificado.findUnique({ where: { codigo } });
  if (!certificado || certificado.revogadoEm) throw naoEncontrado;
  const modelo = (await modelosLiberados([certificado.edicaoId])).get(`${certificado.edicaoId}:${certificado.tipo}`);
  if (!modelo) throw naoEncontrado;
  return montarPdf(certificado, modelo);
}

// ---------------------------------------------------------------------------
// Equipe do evento (MembroEquipe) e convidados das atividades
// (AtividadePessoa) — as pessoas dos certificados EQUIPE_EVENTO e
// ATUACAO_ATIVIDADE. E-mail sem conta fica solto; a conta é ligada quando
// existir (camposContaPorEmail e usuarios.service.js).
// ---------------------------------------------------------------------------

const SELECT_CONTA_VINCULADA = { select: { id: true, nome: true, email: true } };

async function listarEquipe(edicaoId) {
  return prisma.membroEquipe.findMany({
    where: { edicaoId },
    select: {
      id: true,
      nome: true,
      email: true,
      funcao: true,
      cargaHoraria: true,
      usuario: SELECT_CONTA_VINCULADA,
      _count: { select: { certificados: { where: { revogadoEm: null } } } },
    },
    orderBy: [{ funcao: "asc" }, { nome: "asc" }],
  });
}

async function camposMembro(dados) {
  if (dados.usuarioId) {
    const conta = await prisma.usuario.findUnique({ where: { id: dados.usuarioId } });
    if (!contaValida(conta)) throw new ErroHttp(404, "Conta não encontrada.");
    return { email: conta.email.toLowerCase(), usuarioId: conta.id };
  }
  return camposContaPorEmail(dados.email || null);
}

async function salvarMembroEquipe(edicaoId, id, dados) {
  await buscarEdicao(edicaoId);
  const campos = {
    nome: dados.nome,
    funcao: dados.funcao,
    cargaHoraria: dados.cargaHoraria ?? null,
    ...(await camposMembro(dados)),
  };
  if (!id) return prisma.membroEquipe.create({ data: { ...campos, edicaoId } });

  const atual = await prisma.membroEquipe.findFirst({ where: { id, edicaoId } });
  if (!atual) throw new ErroHttp(404, "Membro da equipe não encontrado.");
  return prisma.membroEquipe.update({ where: { id }, data: campos });
}

// Bloqueado com certificado não revogado — revogue antes (o código já pode
// ter sido entregue).
async function excluirMembroEquipe(edicaoId, id) {
  const membro = await prisma.membroEquipe.findFirst({
    where: { id, edicaoId },
    select: { _count: { select: { certificados: { where: { revogadoEm: null } } } } },
  });
  if (!membro) throw new ErroHttp(404, "Membro da equipe não encontrado.");
  if (membro._count.certificados > 0) {
    throw new ErroHttp(409, "Essa pessoa tem certificado emitido. Revogue o certificado antes de removê-la da equipe.");
  }
  await prisma.membroEquipe.delete({ where: { id } });
}

async function listarConvidados(edicaoId) {
  const pessoas = await prisma.atividadePessoa.findMany({
    where: { atividade: { edicaoId } },
    select: {
      id: true,
      nome: true,
      email: true,
      usuario: SELECT_CONTA_VINCULADA,
      tipoParticipacao: { select: { nome: true } },
      atividade: { select: { id: true, nome: true, inicioAtividade: true } },
    },
    orderBy: [{ atividade: { inicioAtividade: "asc" } }, { ordem: "asc" }],
  });
  return pessoas.map(({ tipoParticipacao, ...pessoa }) => ({ ...pessoa, funcao: tipoParticipacao?.nome || null }));
}

// Só e-mail/conta — nome, foto e tipo continuam sendo editados na atividade.
async function atualizarConvidado(edicaoId, id, dados) {
  const pessoa = await prisma.atividadePessoa.findFirst({ where: { id, atividade: { edicaoId } } });
  if (!pessoa) throw new ErroHttp(404, "Convidado não encontrado nesta edição.");
  return prisma.atividadePessoa.update({ where: { id }, data: await camposMembro(dados) });
}

// ---------------------------------------------------------------------------
// Envio por e-mail
// ---------------------------------------------------------------------------

// Pedido pela organização na aba Emitidos (por tipo ou pelos selecionados) e
// feito em segundo plano, um por vez (~600 ms, limite do Resend), como os
// e-mails de resultado. Progresso em Certificado.email*; "Retomar pendentes"
// continua depois de falha ou restart. Só sai certificado válido de tipo
// liberado — o link leva à validação pública, que tem o botão do PDF.

const INTERVALO_ENVIO_MS = 600;
const enviosEmAndamento = new Set();

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

function htmlEmailCertificado({ nome, rotulo, referencia, edicao, codigo, comConta }) {
  const link = urlValidacao(codigo);
  const corpoHtml = `
    <p>Olá, ${escaparHtml(nome)}.</p>
    <p>O seu certificado de <strong>${escaparHtml(rotulo)}</strong>${
      referencia ? ` (${escaparHtml(referencia)})` : ""
    } do ${escaparHtml(edicao)} está disponível.</p>
    ${emailService.botaoEmail(link, "Ver e baixar o certificado")}
    <p>Código de validação: <strong>${escaparHtml(formatarCodigo(codigo))}</strong>. Qualquer pessoa pode conferir a autenticidade do certificado por esse código, no site do evento.</p>
    ${
      comConta
        ? "<p>O certificado também fica disponível em Meus certificados, na sua área do participante.</p>"
        : ""
    }
  `;
  return emailService.layoutEmailPublico({ eyebrow: "Certificado", titulo: escaparHtml(edicao), corpoHtml });
}

// tipos: envia todos os válidos desses tipos; ids: só esses certificados.
// reenviar: inclui quem já recebeu (senão só quem ainda não recebeu).
async function solicitarEnvioEmail(edicaoId, { tipos, ids, reenviar }) {
  const edicao = await buscarEdicao(edicaoId);
  if (enviosEmAndamento.has(edicaoId)) {
    throw new ErroHttp(409, "Já há um envio de certificados em andamento. Aguarde terminar.");
  }

  const liberados = await prisma.modeloCertificado.findMany({
    where: { edicaoId, liberadoEm: { not: null } },
    select: { tipo: true },
  });
  const tiposLiberados = liberados.map((m) => m.tipo);
  if (tiposLiberados.length === 0) {
    throw new ErroHttp(409, "Nenhum tipo de certificado está liberado. Libere o tipo antes de enviar por e-mail.");
  }

  const candidatos = await prisma.certificado.findMany({
    where: {
      edicaoId,
      revogadoEm: null,
      tipo: { in: tipos ? tipos.filter((t) => tiposLiberados.includes(t)) : tiposLiberados },
      ...(ids ? { id: { in: ids } } : {}),
      ...(reenviar ? {} : { emailEnviadoEm: null }),
    },
    select: { id: true, ...SELECT_DESTINO },
  });
  const comEmail = candidatos.filter((c) => emailDestino(c));
  if (comEmail.length === 0) {
    throw new ErroHttp(409, "Nenhum certificado a enviar: todos já foram enviados, não estão liberados ou não têm e-mail.");
  }

  await prisma.certificado.updateMany({
    where: { id: { in: comEmail.map((c) => c.id) } },
    data: { emailSolicitadoEm: new Date(), emailEnviadoEm: null, emailErro: null },
  });
  iniciarEnvioEmSegundoPlano(edicaoId);
  return { solicitados: comEmail.length, semEmail: candidatos.length - comEmail.length, edicao: edicao.nome };
}

function iniciarEnvioEmSegundoPlano(edicaoId) {
  enviarEmailsPendentes(edicaoId).catch((erro) => {
    console.error(`[certificados] Falha no envio de e-mails da edição ${edicaoId}:`, erro);
  });
}

async function retomarEnvioEmail(edicaoId) {
  await buscarEdicao(edicaoId);
  if (enviosEmAndamento.has(edicaoId)) throw new ErroHttp(409, "O envio dos certificados já está em andamento.");
  // Falhas voltam pra fila.
  const { count } = await prisma.certificado.updateMany({
    where: { edicaoId, revogadoEm: null, emailSolicitadoEm: { not: null }, emailEnviadoEm: null },
    data: { emailErro: null },
  });
  if (count === 0) throw new ErroHttp(409, "Não há envios pendentes.");
  iniciarEnvioEmSegundoPlano(edicaoId);
  return count;
}

async function enviarEmailsPendentes(edicaoId) {
  if (enviosEmAndamento.has(edicaoId)) return;
  enviosEmAndamento.add(edicaoId);

  try {
    const edicao = await buscarEdicao(edicaoId);
    const pendentes = await prisma.certificado.findMany({
      where: { edicaoId, revogadoEm: null, emailSolicitadoEm: { not: null }, emailEnviadoEm: null, emailErro: null },
      select: { id: true, tipo: true, codigo: true, dados: true, usuarioId: true, ...SELECT_DESTINO },
      orderBy: { emitidoEm: "asc" },
    });
    const liberados = await modelosLiberados([edicaoId]);

    for (const certificado of pendentes) {
      const email = emailDestino(certificado);
      try {
        if (!liberados.has(`${edicaoId}:${certificado.tipo}`)) throw new Error("Tipo de certificado não está liberado.");
        if (!email) throw new Error("Sem e-mail de destino.");
        await emailService.enviarEmail({
          para: email,
          assunto: `Seu certificado — ${edicao.nome}`,
          html: htmlEmailCertificado({
            nome: certificado.dados?.nome || "",
            rotulo: ROTULOS_TIPO[certificado.tipo],
            referencia: referenciaDe(certificado),
            edicao: edicao.nome,
            codigo: certificado.codigo,
            comConta: Boolean(certificado.usuarioId),
          }),
        });
        await prisma.certificado.update({
          where: { id: certificado.id },
          data: { emailEnviadoEm: new Date(), emailErro: null },
        });
      } catch (erro) {
        console.error(`[certificados] E-mail do certificado ${certificado.id} falhou:`, erro.message);
        await prisma.certificado.update({
          where: { id: certificado.id },
          data: { emailErro: String(erro.message).slice(0, 500) },
        });
      }
      await esperar(INTERVALO_ENVIO_MS);
    }
  } finally {
    enviosEmAndamento.delete(edicaoId);
  }
}

module.exports = {
  TIPOS,
  ROTULOS_TIPO,
  listar,
  salvarModelo,
  previa,
  definirLiberacao,
  gerar,
  incluirManual,
  revogar,
  restaurar,
  revogarEmLote,
  pdfAdmin,
  listarDoParticipante,
  pdfDoParticipante,
  validar,
  pdfPublico,
  salvarMembroEquipe,
  excluirMembroEquipe,
  atualizarConvidado,
  solicitarEnvioEmail,
  retomarEnvioEmail,
};
