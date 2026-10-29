#!/usr/bin/env node
// Inclui UMA submissão do Even3 que ficou de fora da importação
// (importarSubmissoesEven3.js) porque a extração do arquivo falhou — caso
// típico: PDF em que a extração de imagens travou. Aqui o PDF entra só com o
// texto (sem imagens) e a submissão já nasce com a decisão final, a correção
// pendente (ressalvas/formatação) e a atividade de apresentação, porque o
// resultado já foi divulgado e a avaliação está travada.
//
// Prévia por padrão; só grava com --aplicar.
//
// Uso:
//   node src/scripts/incluirSubmissaoEven3Avulsa.js --numero=1734354 [opções]
//
// Opções:
//   --numero=<n>              Número do trabalho no Even3 (obrigatório)
//   --arquivo=<caminho>       .xlsm de origem (default: ~/Downloads/V-Narrativas-2026.xlsm)
//   --edicao=<id>             edicaoId (default: V edição)
//   --cache=<pasta>           cache da importação (default: <script>/.cache-importacao)
//   --decisao=<DECISAO>       APROVADO | APROVADO_COM_RESSALVAS | APROVADO_FORMATACAO (default)
//   --atividade=<id>          atividade da apresentação (default: a da área com menos trabalhos)
//   --sem-atividade           não vincula a nenhuma atividade
//   --aplicar                 grava no banco

require("../config/env");
const fs = require("fs");
const path = require("path");
const os = require("os");
const XLSX = require("xlsx");
const { PDFParse } = require("pdf-parse");
const { JSDOM } = require("jsdom");
const Anthropic = require("@anthropic-ai/sdk");
const prisma = require("../config/prisma");
const sanitizarResumoSubmissao = require("../utils/sanitizarResumoSubmissao");
const sanitizarReferenciaBibliografica = require("../utils/sanitizarReferenciaBibliografica");

const DECISOES = ["APROVADO", "APROVADO_COM_RESSALVAS", "APROVADO_FORMATACAO"];

function lerArgs() {
  const args = {
    numero: null,
    arquivo: path.join(os.homedir(), "Downloads", "V-Narrativas-2026.xlsm"),
    edicaoId: "ee4d88f6-d852-4fa2-98c4-98a60098d4c9",
    cache: path.join(__dirname, ".cache-importacao"),
    decisao: "APROVADO_FORMATACAO",
    atividadeId: null,
    semAtividade: false,
    aplicar: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === "--aplicar") args.aplicar = true;
    else if (arg === "--sem-atividade") args.semAtividade = true;
    else if (arg.startsWith("--numero=")) args.numero = arg.slice("--numero=".length);
    else if (arg.startsWith("--arquivo=")) args.arquivo = arg.slice("--arquivo=".length);
    else if (arg.startsWith("--edicao=")) args.edicaoId = arg.slice("--edicao=".length);
    else if (arg.startsWith("--cache=")) args.cache = arg.slice("--cache=".length);
    else if (arg.startsWith("--decisao=")) args.decisao = arg.slice("--decisao=".length);
    else if (arg.startsWith("--atividade=")) args.atividadeId = arg.slice("--atividade=".length);
  }

  if (!args.numero) throw new Error("Informe --numero=<número do Even3>.");
  if (!DECISOES.includes(args.decisao)) throw new Error(`--decisao deve ser uma de: ${DECISOES.join(", ")}.`);
  return args;
}

// Mesmo mapeamento aba -> modalidade/área de importarSubmissoesEven3.js.
function resolverModalidadeEArea(nomeAba) {
  if (nomeAba === "Experiencias") return { modalidadeSlug: "narrativas-multimodais", areaSlug: null };
  const match = nomeAba.match(/Conversatório\s+(\d+)/);
  if (match) return { modalidadeSlug: "conversatorios", areaSlug: `conversatorio-${match[1]}` };
  return null;
}

function localizarLinha(arquivo, numero) {
  const workbook = XLSX.readFile(arquivo);
  for (const nomeAba of workbook.SheetNames) {
    if (nomeAba === "Geral") continue;
    const mapeamento = resolverModalidadeEArea(nomeAba);
    if (!mapeamento) continue;
    const linhas = XLSX.utils.sheet_to_json(workbook.Sheets[nomeAba], { defval: null });
    const linha = linhas.find((item) => String(item["Número"]).trim() === numero);
    if (linha) return { linha, nomeAba, mapeamento };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Texto do PDF (sem imagens)
// ---------------------------------------------------------------------------

const anthropic = new Anthropic();

// Mesma validação de importarSubmissoesEven3.js: o modelo só pode mexer em
// quebras de linha e números de página soltos.
function normalizarParaComparacao(texto) {
  return texto
    .replace(/(^|\s)\d+(?=\s|$)/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, "");
}

async function reformatarPagina(textoBruto) {
  if (!textoBruto.trim()) return textoBruto;
  try {
    const resposta = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `O texto abaixo foi extraído de um PDF — quebras de linha por largura de coluna ficaram misturadas com quebras de parágrafo reais, e números de página soltos ficaram misturados no meio do texto. Reorganize as quebras de linha: junte linhas que são continuação do mesmo parágrafo (sem quebra no meio), e separe parágrafos distintos (incluindo cada referência bibliográfica, quando houver uma lista delas) com uma linha em branco entre eles. Remova números de página isolados (um número sozinho, sem relação com a frase ao redor — nunca remova um número que faça parte do texto, como um ano ou uma quantidade). NÃO altere, adicione, corrija ortografia ou parafraseie NENHUMA palavra do texto original — preserve exatamente como está, só mude onde ficam as quebras de linha e remova os números de página soltos. Responda só com o texto reformatado, sem nenhum comentário antes ou depois.\n\n---\n\n${textoBruto}`,
        },
      ],
    });
    const texto = resposta.content.filter((bloco) => bloco.type === "text").map((bloco) => bloco.text).join("");
    if (normalizarParaComparacao(texto) !== normalizarParaComparacao(textoBruto)) {
      console.log("  [aviso] reformatação descartada (texto divergiu) — usando a extração original.");
      return textoBruto;
    }
    return texto;
  } catch (erro) {
    console.log(`  [aviso] falha ao reformatar página (${erro.message}) — usando a extração original.`);
    return textoBruto;
  }
}

function escaparHtml(texto) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function paragrafar(texto) {
  return texto
    .split(/\n\s*\n/)
    .map((bloco) => bloco.split("\n").map((linha) => linha.trim()).filter(Boolean).join(" "))
    .filter((paragrafo) => paragrafo && !/^\d+$/.test(paragrafo))
    .map((paragrafo) => `<p>${escaparHtml(paragrafo)}</p>`)
    .join("");
}

async function extrairTextoPdf(caminho) {
  const parser = new PDFParse({ data: fs.readFileSync(caminho) });
  try {
    const resultado = await parser.getText();
    let html = "";
    for (const pagina of resultado.pages) html += paragrafar(await reformatarPagina(pagina.text));
    return html;
  } finally {
    await parser.destroy();
  }
}

// Mesma separação RESUMO / REFERÊNCIAS de importarSubmissoesEven3.js.
const MARCADOR_RESUMO = /\bRESUMO\b\s*:?\s*/;
const MARCADOR_REFERENCIAS = /\bREFER[EÊ]NCIAS?(\s+BIBLIOGR[AÁ]FICAS?)?\b\s*:?\s*/;

function localizarMarcador(blocos, regex) {
  for (let indice = 0; indice < blocos.length; indice++) {
    const texto = blocos[indice].textContent;
    const match = regex.exec(texto);
    if (match) return { indice, textoDepois: texto.slice(match.index + match[0].length).trim() };
  }
  return null;
}

function separarResumoEReferencia(html) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const blocos = Array.from(dom.window.document.body.children);

  const resumo = localizarMarcador(blocos, MARCADOR_RESUMO);
  let corpo = blocos;
  if (resumo) {
    const depois = blocos.slice(resumo.indice + 1).map((bloco) => bloco.outerHTML);
    corpo = (resumo.textoDepois ? [`<p>${escaparHtml(resumo.textoDepois)}</p>`, ...depois] : depois).map((trecho) => {
      const elemento = dom.window.document.createElement("div");
      elemento.innerHTML = trecho;
      return elemento.firstElementChild;
    });
  }

  const referencias = localizarMarcador(corpo, MARCADOR_REFERENCIAS);
  if (!referencias) return { resumo: corpo.map((bloco) => bloco.outerHTML).join(""), referencia: "" };

  return {
    resumo: corpo.slice(0, referencias.indice).map((bloco) => bloco.outerHTML).join(""),
    referencia:
      (referencias.textoDepois ? `<p>${escaparHtml(referencias.textoDepois)}</p>` : "") +
      corpo.slice(referencias.indice + 1).map((bloco) => bloco.outerHTML).join(""),
  };
}

// ---------------------------------------------------------------------------
// Autores
// ---------------------------------------------------------------------------

function parsearAutores(autoresRaw, emailsRaw) {
  const nomes = (autoresRaw || "").split(",").map((nome) => nome.trim()).filter(Boolean);
  const emails = (emailsRaw || "").split(",").map((email) => email.trim()).filter(Boolean);
  if (nomes.length !== emails.length || nomes.length === 0) return null;
  return nomes.map((nome, indice) => ({ nome, email: emails[indice] }));
}

async function contaPorEmail(email) {
  return prisma.usuario.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, ativo: true, anonimizadoEm: null },
    select: { id: true, nome: true, email: true },
  });
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function textoCurto(html, tamanho = 300) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, tamanho);
}

async function main() {
  const args = lerArgs();
  console.log(`Modo: ${args.aplicar ? "APLICAR (grava no banco)" : "prévia (nada é gravado)"}\n`);

  const encontrada = localizarLinha(args.arquivo, args.numero);
  if (!encontrada) throw new Error(`Número ${args.numero} não encontrado nas abas da planilha.`);
  const { linha, nomeAba, mapeamento } = encontrada;
  const titulo = String(linha["Título"] || "").trim();
  console.log(`Planilha: aba "${nomeAba}" — ${titulo}`);

  const edicao = await prisma.edicao.findUnique({
    where: { id: args.edicaoId },
    select: { id: true, resultadoDivulgadoEm: true, anais: { select: { publicadoEm: true } } },
  });
  if (!edicao) throw new Error(`Edição ${args.edicaoId} não encontrada.`);

  const modalidade = await prisma.modalidadeSubmissao.findFirst({
    where: { edicaoId: edicao.id, slug: mapeamento.modalidadeSlug },
    include: { areas: { include: { atividades: { select: { id: true, nome: true, inicioAtividade: true } } } } },
  });
  if (!modalidade) throw new Error(`Modalidade "${mapeamento.modalidadeSlug}" não encontrada.`);
  const area = mapeamento.areaSlug ? modalidade.areas.find((item) => item.slug === mapeamento.areaSlug) : null;
  if (mapeamento.areaSlug && !area) throw new Error(`Área "${mapeamento.areaSlug}" não encontrada.`);

  const autoresPlanilha = parsearAutores(linha["Autores"], linha["Emails"]);
  if (!autoresPlanilha) throw new Error("Autores/E-mails da planilha com contagens diferentes ou vazios.");
  const contaPrincipal = await contaPorEmail(autoresPlanilha[0].email);
  if (!contaPrincipal) {
    throw new Error(`O autor principal (${autoresPlanilha[0].email}) não tem conta ativa — crie/convide antes de incluir.`);
  }

  const duplicada = await prisma.submissao.findFirst({
    where: { edicaoId: edicao.id, usuarioId: contaPrincipal.id, titulo: { equals: titulo, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicada) throw new Error(`Já existe uma submissão com esse título dessa pessoa (${duplicada.id}).`);

  const autores = [];
  for (const [indice, autor] of autoresPlanilha.entries()) {
    const conta = indice === 0 ? contaPrincipal : await contaPorEmail(autor.email);
    autores.push({
      nome: conta?.nome || autor.nome,
      email: indice === 0 ? conta.email : autor.email,
      usuarioId: conta?.id || null,
      principal: indice === 0,
      ordem: indice,
    });
  }

  // Arquivo baixado pela importação (mesmo nome: <número>.<ext>).
  const pastaDownloads = path.join(args.cache, "downloads");
  const arquivo = fs.readdirSync(pastaDownloads).find((nome) => nome.split(".")[0] === args.numero);
  if (!arquivo) throw new Error(`Arquivo ${args.numero}.* não encontrado em ${pastaDownloads}.`);
  if (path.extname(arquivo).toLowerCase() !== ".pdf") throw new Error(`Só PDF é suportado aqui (veio ${arquivo}).`);

  console.log(`Extraindo texto de ${arquivo} (sem imagens)...`);
  const { resumo: resumoBruto, referencia: referenciaBruta } = separarResumoEReferencia(
    await extrairTextoPdf(path.join(pastaDownloads, arquivo))
  );
  const resumo = sanitizarResumoSubmissao(resumoBruto);
  const referencia = sanitizarReferenciaBibliografica(referenciaBruta);
  if (!resumo) throw new Error("Resumo vazio depois da extração.");

  // Atividade da apresentação: a pedida ou, entre as da área, a com menos
  // trabalhos (empate: a que começa mais cedo) — como "Distribuir pela área".
  let atividade = null;
  if (!args.semAtividade) {
    const candidatas = args.atividadeId
      ? await prisma.atividade.findMany({ where: { id: args.atividadeId, edicaoId: edicao.id }, select: { id: true, nome: true, inicioAtividade: true } })
      : area?.atividades || [];
    if (args.atividadeId && candidatas.length === 0) throw new Error(`Atividade ${args.atividadeId} não encontrada na edição.`);
    const comCarga = await Promise.all(
      candidatas.map(async (item) => ({ ...item, trabalhos: await prisma.submissao.count({ where: { atividadeApresentacaoId: item.id } }) }))
    );
    comCarga.sort((a, b) => a.trabalhos - b.trabalhos || new Date(a.inicioAtividade) - new Date(b.inicioAtividade));
    atividade = comCarga[0] || null;
  }

  const [dia, mes, ano] = String(linha["Data da submissão"]).split("/");
  const createdAt = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
  const exigeCorrecao = args.decisao !== "APROVADO";

  console.log("\n=== Prévia ===");
  console.log(`Modalidade/área: ${modalidade.nome} / ${area?.titulo || "—"}`);
  console.log(`Data da submissão: ${createdAt.toISOString().slice(0, 10)}`);
  autores.forEach((autor) =>
    console.log(`Autor ${autor.principal ? "principal" : "coautor"}: ${autor.nome} <${autor.email}>${autor.usuarioId ? " (conta ligada)" : " (sem conta)"}`)
  );
  console.log(`Decisão final: ${args.decisao}${exigeCorrecao ? " — correção PENDENTE" : ""}`);
  console.log(`Apresentação: ${atividade ? `${atividade.nome} (${atividade.trabalhos} trabalho(s) hoje; entra como ${atividade.trabalhos + 1}º)` : "sem atividade"}`);
  if (!edicao.resultadoDivulgadoEm) console.log("Aviso: o resultado da edição ainda não foi divulgado.");
  if (edicao.anais?.publicadoEm) console.log("Aviso: os Anais já foram publicados — o trabalho só entra numa nova geração.");
  console.log(`\nResumo (${textoCurto(resumo, 100000).length} caracteres): ${textoCurto(resumo)}...`);
  console.log(`\nReferências (${textoCurto(referencia, 100000).length} caracteres): ${textoCurto(referencia)}...`);

  if (!args.aplicar) {
    console.log("\nNada foi gravado. Rode de novo com --aplicar para incluir.");
    return;
  }

  const criada = await prisma.$transaction(async (tx) => {
    const ultima = atividade
      ? await tx.submissao.aggregate({ where: { atividadeApresentacaoId: atividade.id }, _max: { ordemApresentacao: true } })
      : null;
    return tx.submissao.create({
      data: {
        edicaoId: edicao.id,
        modalidadeSubmissaoId: modalidade.id,
        areaSubmissaoId: area?.id || null,
        titulo,
        resumo,
        referenciaBibliografica: referencia,
        usuarioId: contaPrincipal.id,
        autores: { create: autores },
        decisaoFinal: args.decisao,
        decisaoFinalEm: new Date(),
        statusCorrecao: exigeCorrecao ? "PENDENTE" : null,
        atividadeApresentacaoId: atividade?.id || null,
        ordemApresentacao: atividade ? (ultima._max.ordemApresentacao || 0) + 1 : null,
        createdAt,
      },
      select: { id: true },
    });
  });

  console.log(`\nSubmissão criada: ${criada.id}`);
}

main()
  .catch((erro) => {
    console.error(`\nErro: ${erro.message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
