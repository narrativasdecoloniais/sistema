const pdfmake = require("pdfmake");
const { FONTES, PASTAS_FONTES, aplicarFontes } = require("../utils/fontesPdf");
const { citacaoAbnt } = require("../utils/citacao");
const { linhaIdentificadores, periodoEvento, localEvento } = require("../utils/formatacaoAnais");

// Desenha os Anais em PDF (pdfmake no Node) a partir do modelo neutro de
// anaisDocumento.service.js. Puro: recebe tudo carregado (inclusive
// imagens) e devolve Buffer + as páginas de cada trabalho.
//
// Estrutura dos Anais completos:
//   capa (só se a organização enviou a imagem) · folha de rosto · créditos
//   (ficha catalográfica, ISSN/ISBN, licença) · expediente · apresentação ·
//   sumário · por modalidade, uma página de abertura e os trabalhos (cada um
//   em página nova: área, título, autores, resumo, referências, "Como
//   citar") · índice de autores.
// As páginas pré-textuais não têm cabeçalho nem número; a numeração segue a
// contagem absoluta de páginas (é a que o sumário e as citações usam).
// Imagens de cabeçalho/rodapé enviadas pela organização entram em todas as
// páginas dos trabalhos (e do PDF individual), de borda a borda; o cabeçalho
// em imagem substitui o textual. O modelo de página (arte A4 inteira) fica no
// fundo de todas as páginas menos a capa, por baixo das faixas.

// Paleta pública (styles/_tokens-publico.scss) — o PDF não enxerga as
// variáveis CSS, os valores ficam repetidos aqui (como em pdfProgramacao.js).
const COR = {
  tinta: "#201914",
  barro: "#9c4a2f",
  ocre: "#b87c34",
  buzio: "#edb153",
  areia: "#ede4d4",
  papel: "#faf6ee",
  textoSuave: "#4d4842",
  linha: "#d9ccb6",
};

const A4 = { largura: 595.28, altura: 841.89 };
const MARGENS = [64, 78, 64, 72]; // esquerda, topo, direita, base
const LARGURA_CONTEUDO = A4.largura - MARGENS[0] - MARGENS[2];
// Faixa de cabeçalho/rodapé mais alta que isso é reduzida (e centralizada)
// pra não engolir a página.
const ALTURA_MAX_FAIXA = 150;

// ---------------------------------------------------------------------------
// Fontes: Archivo (títulos), Source Serif 4 (corpo) e Saira Stencil (topo do
// PDF individual), fatiadas por alfabeto, com a DejaVu Sans de reserva — ver
// fontesPdf.js.
// ---------------------------------------------------------------------------

pdfmake.setFonts(FONTES);
// Nada de buscar recurso externo durante a geração; do disco, só as fontes.
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy((caminho) => PASTAS_FONTES.some((pasta) => caminho.startsWith(pasta)));

const ESTILOS = {
  sobretitulo: { font: "Archivo", fontSize: 8, bold: true, color: COR.barro, characterSpacing: 1.4 },
  tituloSecao: { font: "Archivo", fontSize: 20, bold: true, color: COR.tinta, margin: [0, 0, 0, 18] },
  tituloModalidade: { font: "Archivo", fontSize: 26, bold: true, color: COR.tinta, lineHeight: 1.05 },
  tituloArea: { font: "Archivo", fontSize: 12, bold: true, color: COR.barro, margin: [0, 0, 0, 2] },
  tituloArtigo: { font: "Archivo", fontSize: 16, bold: true, color: COR.tinta, lineHeight: 1.15, margin: [0, 6, 0, 10] },
  autores: { font: "Serif", fontSize: 10.5, color: COR.tinta, lineHeight: 1.3 },
  rotulo: { font: "Archivo", fontSize: 8, bold: true, color: COR.barro, characterSpacing: 1.2, margin: [0, 14, 0, 6] },
  corpo: { font: "Serif", fontSize: 10.5, lineHeight: 1.38, alignment: "justify", margin: [0, 0, 0, 7] },
  referencia: { font: "Serif", fontSize: 9.5, lineHeight: 1.25, margin: [0, 0, 0, 6] },
  h2: { font: "Archivo", fontSize: 13, bold: true, margin: [0, 10, 0, 6] },
  h3: { font: "Archivo", fontSize: 11, bold: true, margin: [0, 8, 0, 4] },
  celula: { font: "Serif", fontSize: 8.5, lineHeight: 1.2, alignment: "left", margin: [0, 0, 0, 0] },
  celulaCabecalho: { font: "Archivo", fontSize: 8.5, bold: true, lineHeight: 1.2, alignment: "left", margin: [0, 0, 0, 0] },
  legendaImagem: { font: "Archivo", fontSize: 8, italics: true, color: COR.textoSuave, alignment: "center", margin: [0, 2, 0, 10] },
  citacao: { font: "Serif", fontSize: 9, lineHeight: 1.3, color: COR.tinta },
  cabecalho: { font: "Archivo", fontSize: 7.5, color: COR.textoSuave },
  rodape: { font: "Archivo", fontSize: 8, color: COR.textoSuave },
  pequeno: { font: "Archivo", fontSize: 8.5, color: COR.textoSuave, lineHeight: 1.35 },
  expedienteLista: { font: "Archivo", fontSize: 9.5, bold: true, margin: [0, 10, 0, 3] },
  expedienteItem: { font: "Serif", fontSize: 10, lineHeight: 1.3 },
  ficha: { font: "Archivo", fontSize: 8.5, lineHeight: 1.3, preserveLeadingSpaces: true },
  indiceNome: { font: "Serif", fontSize: 9.5, lineHeight: 1.25 },
};

// ---------------------------------------------------------------------------
// Rich text → pdfmake
// ---------------------------------------------------------------------------

function inlines(trechos) {
  return trechos.map((trecho) => {
    const inline = { text: trecho.texto };
    if (trecho.negrito) inline.bold = true;
    if (trecho.italico) inline.italics = true;
    if (trecho.link) {
      inline.link = trecho.link;
      inline.color = COR.barro;
      inline.decoration = "underline";
    }
    return inline;
  });
}

// Registro de imagens do documento (chave → data URL), pra cada arquivo
// entrar uma vez só no PDF mesmo que se repita.
function criarRegistroImagens() {
  const porDados = new Map();
  const imagens = {};
  return {
    imagens,
    chave(imagem) {
      if (!porDados.has(imagem.dados)) {
        const chave = `img${porDados.size + 1}`;
        porDados.set(imagem.dados, chave);
        const mime = imagem.formato === "jpg" ? "image/jpeg" : "image/png";
        imagens[chave] = `data:${mime};base64,${imagem.dados.toString("base64")}`;
      }
      return porDados.get(imagem.dados);
    },
  };
}

function tabelaPdf(bloco, ctx, largura) {
  const totalLinhas = bloco.linhas.length;
  const grade = bloco.linhas.map(() => []);

  bloco.linhas.forEach((linha, r) => {
    let c = 0;
    for (const celula of linha) {
      while (grade[r][c] !== undefined) c += 1;
      const rowSpan = Math.min(celula.rowspan, totalLinhas - r);
      const colSpan = celula.colspan;
      const no = {
        stack: blocosPdf(celula.blocos, { ...ctx, estiloParagrafo: celula.cabecalho ? "celulaCabecalho" : "celula" }, largura / 2),
      };
      if (celula.cabecalho) no.fillColor = COR.areia;
      if (colSpan > 1) no.colSpan = colSpan;
      if (rowSpan > 1) no.rowSpan = rowSpan;
      grade[r][c] = no;
      for (let dr = 0; dr < rowSpan; dr += 1) {
        for (let dc = 0; dc < colSpan; dc += 1) {
          if (dr || dc) grade[r + dr][c + dc] = {};
        }
      }
      c += colSpan;
    }
  });

  const colunas = Math.max(...grade.map((linha) => linha.length));
  const corpo = grade.map((linha) => {
    const completa = [];
    for (let c = 0; c < colunas; c += 1) completa.push(linha[c] === undefined ? { text: "" } : linha[c]);
    return completa;
  });

  let linhasCabecalho = 0;
  while (
    linhasCabecalho < bloco.linhas.length - 1 &&
    bloco.linhas[linhasCabecalho].every((celula) => celula.cabecalho)
  ) {
    linhasCabecalho += 1;
  }

  return {
    table: { headerRows: linhasCabecalho, widths: Array(colunas).fill("*"), body: corpo },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => COR.linha,
      vLineColor: () => COR.linha,
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 3,
      paddingBottom: () => 3,
    },
    margin: [0, 4, 0, 10],
  };
}

function blocoPdf(bloco, ctx, largura) {
  switch (bloco.tipo) {
    case "paragrafo":
      return { text: inlines(bloco.trechos), style: ctx.estiloParagrafo };
    case "titulo":
      return { text: inlines(bloco.trechos), style: bloco.nivel === 2 ? "h2" : "h3" };
    case "lista": {
      const itens = bloco.itens.map((item) => {
        const nos = blocosPdf(item, ctx, largura - 14);
        return nos.length === 1 ? nos[0] : { stack: nos };
      });
      return { [bloco.ordenada ? "ol" : "ul"]: itens, margin: [4, 0, 0, 7], style: ctx.estiloParagrafo };
    }
    case "imagem": {
      if (bloco.ausente || !bloco.dados) return null;
      // Imagens pensadas para tela: ~150 dpi dá um tamanho de leitura
      // natural; nunca passa da largura disponível nem de ~45% da altura.
      const larguraNatural = (bloco.largura * 72) / 150;
      const largura2 = Math.min(largura, larguraNatural);
      const alturaMax = A4.altura * 0.45;
      const escala = Math.min(1, alturaMax / ((bloco.altura / bloco.largura) * largura2));
      const nos = [
        {
          image: ctx.registro.chave(bloco),
          width: largura2 * escala,
          alignment: "center",
          margin: [0, 6, 0, bloco.alt ? 2 : 10],
        },
      ];
      if (bloco.alt) nos.push({ text: bloco.alt, style: "legendaImagem" });
      return { stack: nos, unbreakable: true };
    }
    case "tabela":
      return tabelaPdf(bloco, ctx, largura);
    default:
      return null;
  }
}

function blocosPdf(blocos, ctx, largura = LARGURA_CONTEUDO) {
  return blocos.map((bloco) => blocoPdf(bloco, ctx, largura)).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Peças comuns
// ---------------------------------------------------------------------------

function fio(largura = LARGURA_CONTEUDO, cor = COR.linha, espessura = 0.75, margem = [0, 0, 0, 0]) {
  return { canvas: [{ type: "line", x1: 0, y1: 0, x2: largura, y2: 0, lineWidth: espessura, lineColor: cor }], margin: margem };
}

function cabecalhoTextual(anais) {
  const identificadores = linhaIdentificadores(anais);
  return () => ({
    margin: [MARGENS[0], 34, MARGENS[2], 0],
    stack: [
      {
        columns: [
          { text: anais.titulo, style: "cabecalho", width: "*" },
          { text: identificadores, style: "cabecalho", width: "auto", alignment: "right" },
        ],
        columnGap: 12,
      },
      fio(LARGURA_CONTEUDO, COR.linha, 0.5, [0, 5, 0, 0]),
    ],
  });
}

function rodapeNumerado(deslocamento = 0, margemTopo = 30) {
  return (paginaAtual) => ({
    text: String(paginaAtual + deslocamento),
    style: "rodape",
    alignment: "center",
    margin: [0, margemTopo, 0, 0],
  });
}

// Imagem na largura da página (ou menor, centralizada, se passar da altura
// máxima).
function medidasFaixa(imagem) {
  let largura = A4.largura;
  let altura = (imagem.altura / imagem.largura) * largura;
  if (altura > ALTURA_MAX_FAIXA) {
    largura *= ALTURA_MAX_FAIXA / altura;
    altura = ALTURA_MAX_FAIXA;
  }
  return { largura, altura, x: (A4.largura - largura) / 2 };
}

// Fundo de página inteira com o modelo de página enviado (já recortado na
// proporção do A4 em imagensAnais.service.js), ou null sem modelo. Nós novos
// a cada página — o pdfmake altera os nós ao diagramar.
function fundoModelo(imagens, registro) {
  if (!imagens?.modeloPagina) return null;
  const chave = registro.chave(imagens.modeloPagina);
  return () => ({ image: chave, width: A4.largura, height: A4.altura, absolutePosition: { x: 0, y: 0 } });
}

// Moldura das páginas dos trabalhos: margens, cabeçalho, rodapé numerado e,
// no fundo, o modelo de página e as imagens de cabeçalho/rodapé que a
// organização enviou. As imagens vão no background (posição fixa na página)
// e as margens crescem pra que o texto não passe por cima das faixas.
function moldura(imagens, registro, { topo, cabecalhoTextual, deslocamento = 0 }) {
  const cabecalho = imagens?.cabecalho ? medidasFaixa(imagens.cabecalho) : null;
  const rodape = imagens?.rodape ? medidasFaixa(imagens.rodape) : null;
  const modelo = fundoModelo(imagens, registro);
  const margemTopo = cabecalho ? Math.max(topo, cabecalho.altura + 24) : topo;
  const margemBase = rodape ? Math.max(MARGENS[3], rodape.altura + 40) : MARGENS[3];

  const chaveCabecalho = cabecalho ? registro.chave(imagens.cabecalho) : null;
  const chaveRodape = rodape ? registro.chave(imagens.rodape) : null;
  const fundo = () => {
    const nos = [];
    if (modelo) nos.push(modelo());
    if (cabecalho) {
      nos.push({
        image: chaveCabecalho,
        width: cabecalho.largura,
        height: cabecalho.altura,
        absolutePosition: { x: cabecalho.x, y: 0 },
      });
    }
    if (rodape) {
      // Encosta na borda de baixo (meio ponto de folga contra arredondamento).
      nos.push({
        image: chaveRodape,
        width: rodape.largura,
        height: rodape.altura,
        absolutePosition: { x: rodape.x, y: A4.altura - rodape.altura - 0.5 },
      });
    }
    return { stack: nos };
  };

  return {
    pageMargins: [MARGENS[0], margemTopo, MARGENS[2], margemBase],
    header: cabecalho ? null : cabecalhoTextual,
    footer: rodapeNumerado(deslocamento, rodape ? margemBase - rodape.altura - 24 : 30),
    background: modelo || cabecalho || rodape ? fundo : null,
  };
}

function autoresPdf(autores) {
  const partes = [];
  autores.forEach((autor, indice) => {
    if (indice > 0) partes.push({ text: "; " });
    partes.push({ text: autor.nome });
    if (autor.orcid) {
      partes.push({
        text: ` (ORCID ${autor.orcid.replace(/^https?:\/\/orcid\.org\//i, "")})`,
        link: /^https?:/i.test(autor.orcid) ? autor.orcid : `https://orcid.org/${autor.orcid}`,
        fontSize: 8.5,
        color: COR.textoSuave,
      });
    }
  });
  return partes;
}

function caixaCitacao(artigo, { paginas, id }) {
  const trechos = citacaoAbnt({
    ...artigo.citacao,
    paginaInicial: paginas?.inicio || null,
    paginaFinal: paginas?.fim || null,
    acessoEm: new Date(),
  });
  // "Disponível em … Acesso em …" só faz sentido para quem cita a página
  // online; no PDF a referência fica na forma impressa.
  const semAcesso = trechos.map((trecho) => ({
    ...trecho,
    texto: trecho.texto.replace(/ Disponível em: .*$/, ""),
  }));
  return {
    unbreakable: true,
    margin: [0, 18, 0, 0],
    table: {
      widths: ["*"],
      body: [
        [
          {
            fillColor: COR.papel,
            margin: [10, 8, 10, 9],
            stack: [
              { text: "COMO CITAR ESTE TRABALHO", style: "sobretitulo", id, margin: [0, 0, 0, 5] },
              {
                text: semAcesso.map((trecho) => (trecho.destaque ? { text: trecho.texto, bold: true } : trecho.texto)),
                style: "citacao",
              },
              artigo.citacao.url
                ? { text: artigo.citacao.url, link: artigo.citacao.url, style: "pequeno", color: COR.barro, margin: [0, 5, 0, 0] }
                : null,
            ].filter(Boolean),
          },
        ],
      ],
    },
    layout: {
      hLineWidth: (i) => (i === 0 ? 1.5 : 0),
      vLineWidth: () => 0,
      hLineColor: () => COR.buzio,
    },
  };
}

function rotuloArea(artigo) {
  return [artigo.modalidade?.nome, artigo.area?.titulo].filter(Boolean).join(" · ").toLocaleUpperCase("pt-BR");
}

// Corpo de um trabalho. ids ini-/fim- marcam a primeira página (título) e a
// última (caixa "Como citar", inquebrável) — lidos no pageBreakBefore.
function artigoPdf(artigo, ctx, { paginas, noSumario, quebraAntes, semRotulo }) {
  const conteudo = [
    semRotulo ? null : { text: rotuloArea(artigo), style: "sobretitulo", margin: [0, 0, 0, 0] },
    {
      text: artigo.titulo,
      style: "tituloArtigo",
      id: `ini-${artigo.id}`,
      ...(noSumario ? { tocItem: true, tocStyle: { font: "Serif", fontSize: 9.5 }, tocMargin: [18, 3, 0, 0] } : {}),
    },
    { text: autoresPdf(artigo.autores), style: "autores" },
    fio(LARGURA_CONTEUDO, COR.linha, 0.75, [0, 12, 0, 0]),
    { text: "RESUMO", style: "rotulo" },
    ...blocosPdf(artigo.resumo, { ...ctx, estiloParagrafo: "corpo" }),
  ];
  const referencias = blocosPdf(artigo.referencias, { ...ctx, estiloParagrafo: "referencia" });
  if (referencias.length) conteudo.push({ text: "REFERÊNCIAS", style: "rotulo" }, ...referencias);
  conteudo.push(caixaCitacao(artigo, { paginas, id: `fim-${artigo.id}` }));
  return { stack: conteudo.filter(Boolean), pageBreak: quebraAntes ? "before" : undefined };
}

// ---------------------------------------------------------------------------
// Pré-textuais
// ---------------------------------------------------------------------------

// Capa = a imagem enviada pela organização, ocupando a página inteira (já
// recortada na proporção do A4 em imagensAnais.service.js). Sem imagem, sem
// capa: os Anais começam na folha de rosto. O modelo de página não entra
// por baixo dela.
function capa(documento, registro) {
  const imagem = documento.imagens?.capa;
  if (!imagem) return null;
  return {
    section: [{ image: registro.chave(imagem), width: A4.largura, height: A4.altura }],
    pageMargins: [0, 0, 0, 0],
    header: null,
    footer: null,
    background: null,
  };
}

function folhaDeRosto(documento) {
  const { anais, edicao } = documento;
  const imprenta = [anais.localPublicacao, anais.editora, anais.anoPublicacao].filter(Boolean);
  const conteudo = [];
  if (anais.organizadores?.length) {
    conteudo.push({
      text: anais.organizadores.join("\n"),
      font: "Archivo",
      fontSize: 11,
      alignment: "center",
      lineHeight: 1.35,
      margin: [0, 10, 0, 0],
    });
    conteudo.push({
      text: anais.organizadores.length > 1 ? "(Organizadores)" : "(Organização)",
      style: "pequeno",
      alignment: "center",
      margin: [0, 4, 0, 0],
    });
  }
  conteudo.push(
    { text: anais.titulo, font: "Archivo", fontSize: 18, bold: true, alignment: "center", lineHeight: 1.2, margin: [0, 190, 0, 0] },
    anais.subtitulo ? { text: anais.subtitulo, font: "Archivo", fontSize: 12, alignment: "center", color: COR.textoSuave, margin: [0, 8, 0, 0] } : null,
    { text: edicao.nome, font: "Serif", fontSize: 11, italics: true, alignment: "center", margin: [0, 24, 0, 0] },
    {
      text: [localEvento(edicao), periodoEvento(edicao)].filter(Boolean).join(", "),
      font: "Serif",
      fontSize: 10,
      alignment: "center",
      margin: [0, 4, 0, 0],
    },
    imprenta.length
      ? {
          text: [anais.localPublicacao, anais.editora, anais.anoPublicacao].filter(Boolean).join("\n"),
          font: "Archivo",
          fontSize: 10,
          alignment: "center",
          lineHeight: 1.4,
          absolutePosition: { x: MARGENS[0], y: A4.altura - 150 },
          width: LARGURA_CONTEUDO,
        }
      : null
  );
  return { section: conteudo.filter(Boolean), header: null, footer: null };
}

function creditos(documento) {
  const { anais } = documento;
  const licenca = anais.licencaInfo;
  const conteudo = [];
  const identificadores = linhaIdentificadores(anais);

  conteudo.push({ text: anais.titulo, font: "Archivo", fontSize: 10, bold: true });
  if (identificadores) conteudo.push({ text: identificadores, style: "pequeno", margin: [0, 3, 0, 0] });

  if (licenca) {
    const texto =
      licenca.url
        ? [
            "Esta obra está licenciada sob a licença ",
            { text: `${licenca.nome} (${licenca.sigla})`, link: licenca.url, color: COR.barro },
            ". Os textos são de responsabilidade de seus autores e autoras.",
          ]
        : "Todos os direitos reservados. Os textos são de responsabilidade de seus autores e autoras.";
    conteudo.push({ text: texto, style: "pequeno", margin: [0, 14, 0, 0] });
  }

  if (anais.fichaCatalografica) {
    conteudo.push({
      margin: [LARGURA_CONTEUDO * 0.1, 40, LARGURA_CONTEUDO * 0.1, 0],
      stack: [
        { text: "Dados Internacionais de Catalogação na Publicação (CIP)", style: "pequeno", bold: true, alignment: "center", margin: [0, 0, 0, 6] },
        {
          table: {
            widths: ["*"],
            body: [[{ text: anais.fichaCatalografica, style: "ficha", margin: [10, 10, 10, 10] }]],
          },
          layout: { hLineWidth: () => 0.75, vLineWidth: () => 0.75, hLineColor: () => COR.tinta, vLineColor: () => COR.tinta },
        },
      ],
    });
  }
  return { section: conteudo, header: null, footer: null };
}

function expediente(documento) {
  if (!documento.expediente?.length) return null;
  const conteudo = [{ text: "Expediente", style: "tituloSecao" }];
  for (const grupo of documento.expediente) {
    conteudo.push({ text: grupo.nome.toLocaleUpperCase("pt-BR"), style: "sobretitulo", margin: [0, 14, 0, 2] });
    for (const lista of grupo.listas) {
      conteudo.push({ text: lista.nome, style: "expedienteLista" });
      conteudo.push({ text: lista.itens.join("\n"), style: "expedienteItem" });
    }
  }
  return { section: conteudo, header: null, footer: null };
}

function apresentacao(documento, ctx) {
  const blocos = blocosPdf(documento.apresentacao || [], { ...ctx, estiloParagrafo: "corpo" });
  if (!blocos.length) return null;
  return {
    section: [
      { text: "Apresentação", style: "tituloSecao", tocItem: true, tocStyle: { font: "Archivo", bold: true, fontSize: 10 }, tocMargin: [0, 0, 0, 4] },
      ...blocos,
    ],
    header: null,
    footer: null,
  };
}

function sumario() {
  return {
    section: [
      {
        toc: {
          title: { text: "Sumário", style: "tituloSecao" },
          numberStyle: { font: "Archivo", fontSize: 9.5 },
          textStyle: { font: "Serif", fontSize: 9.5 },
          textMargin: [0, 2, 0, 0],
        },
      },
    ],
    header: null,
    footer: null,
  };
}

// As páginas vêm da passada anterior (ver gerarPdfAnais) — o pageReference
// do pdfmake reserva largura fixa e deixa buracos entre os números. O índice
// é a última seção, então não mexe na paginação dos trabalhos.
function indiceAutores(documento, paginasArtigos) {
  const linhas = documento.autores.map((autor) => {
    const paginas = [];
    autor.artigos.forEach((artigoId, indice) => {
      if (indice > 0) paginas.push({ text: ", " });
      const pagina = paginasArtigos?.get(artigoId)?.inicio;
      paginas.push({ text: pagina ? String(pagina) : "00", linkToDestination: `ini-${artigoId}`, color: COR.barro });
    });
    return { text: [{ text: autor.nome }, { text: "  " }, ...paginas], style: "indiceNome", margin: [0, 0, 0, 2] };
  });
  return [
    {
      text: "Índice de autores",
      style: "tituloSecao",
      pageBreak: "before",
      tocItem: true,
      tocStyle: { font: "Archivo", bold: true, fontSize: 10 },
      tocMargin: [0, 12, 0, 0],
      id: "indice-autores",
    },
    ...linhas,
  ];
}

// ---------------------------------------------------------------------------
// Documentos
// ---------------------------------------------------------------------------

function textuais(documento, ctx, paginas) {
  const conteudo = [];
  documento.secoes.forEach((secao, indiceSecao) => {
    conteudo.push({
      pageBreak: indiceSecao > 0 ? "before" : undefined,
      margin: [0, 180, 0, 0],
      stack: [
        { text: "MODALIDADE", style: "sobretitulo" },
        fio(60, COR.buzio, 3, [0, 8, 0, 14]),
        {
          text: secao.modalidade.nome,
          style: "tituloModalidade",
          tocItem: true,
          tocStyle: { font: "Archivo", bold: true, fontSize: 10.5 },
          tocMargin: [0, 14, 0, 2],
        },
        {
          text: `${secao.areas.reduce((total, area) => total + area.artigos.length, 0)} trabalhos`,
          style: "pequeno",
          margin: [0, 10, 0, 0],
        },
      ],
    });
    for (const area of secao.areas) {
      area.artigos.forEach((artigo, indiceArtigo) => {
        const blocoArtigo = artigoPdf(artigo, ctx, {
          paginas: paginas?.get(artigo.id),
          noSumario: true,
          quebraAntes: indiceArtigo > 0,
          // O 1º trabalho da área já vem logo abaixo do título da área.
          semRotulo: indiceArtigo === 0 && Boolean(area.titulo),
        });
        if (indiceArtigo === 0) {
          conteudo.push({
            pageBreak: "before",
            stack: [
              area.titulo
                ? {
                    text: area.titulo,
                    style: "tituloArea",
                    tocItem: true,
                    tocStyle: { font: "Archivo", italics: true, fontSize: 9.5, color: COR.barro },
                    tocMargin: [8, 8, 0, 1],
                  }
                : null,
              area.titulo ? fio(LARGURA_CONTEUDO, COR.barro, 1, [0, 2, 0, 14]) : null,
              blocoArtigo,
            ].filter(Boolean),
          });
        } else {
          conteudo.push(blocoArtigo);
        }
      });
    }
  });
  conteudo.push(...indiceAutores(documento, paginas));
  return conteudo;
}

async function renderizar(definicao, { capturarIds } = {}) {
  const posicoes = new Map();
  if (capturarIds) {
    definicao.pageBreakBefore = (no) => {
      if (no.id && capturarIds(no.id)) posicoes.set(no.id, no.pageNumbers);
      return false;
    };
  }
  const buffer = await pdfmake.createPdf(aplicarFontes(definicao)).getBuffer();
  return { buffer, posicoes };
}

function montarDefinicao(documento, paginas) {
  const registro = criarRegistroImagens();
  const ctx = { registro };
  // Pré-textuais herdam o fundo do documento; capa e trabalhos definem o seu.
  const modelo = fundoModelo(documento.imagens, registro);
  const secoes = [
    capa(documento, registro),
    folhaDeRosto(documento),
    creditos(documento),
    expediente(documento),
    apresentacao(documento, ctx),
    sumario(),
    {
      section: textuais(documento, ctx, paginas),
      ...moldura(documento.imagens, registro, {
        topo: MARGENS[1],
        cabecalhoTextual: cabecalhoTextual(documento.anais),
      }),
    },
  ].filter(Boolean);

  return {
    pageSize: "A4",
    pageMargins: MARGENS,
    info: {
      title: documento.anais.titulo,
      subject: documento.edicao.nome,
      author: documento.anais.editora || documento.edicao.nome,
      creator: "Narrativas — GPDES/UnB",
    },
    content: secoes,
    ...(modelo ? { background: modelo } : {}),
    images: registro.imagens,
    styles: ESTILOS,
    defaultStyle: { font: "Serif", fontSize: 10.5, color: COR.tinta },
  };
}

function paginasDosArtigos(documento, posicoes) {
  const paginas = new Map();
  for (const artigo of documento.artigos) {
    const inicio = posicoes.get(`ini-${artigo.id}`);
    const fim = posicoes.get(`fim-${artigo.id}`);
    if (!inicio) continue;
    paginas.set(artigo.id, {
      inicio: Math.min(...inicio),
      fim: fim ? Math.max(...fim) : Math.max(...inicio),
    });
  }
  return paginas;
}

function mesmasPaginas(a, b) {
  if (!a || a.size !== b.size) return false;
  for (const [id, pagina] of b) {
    const outra = a.get(id);
    if (!outra || outra.inicio !== pagina.inicio || outra.fim !== pagina.fim) return false;
  }
  return true;
}

// Anais completos. As citações levam as páginas do próprio trabalho, que só
// se conhecem depois de diagramar — então diagrama de novo com elas até as
// páginas pararem de mudar (em geral na 2ª passada; no máximo 3).
async function gerarPdfAnais(documento) {
  const ehMarcador = (id) => id.startsWith("ini-") || id.startsWith("fim-");
  let paginas = null;
  let resultado = null;
  for (let passada = 0; passada < 3; passada += 1) {
    resultado = await renderizar(montarDefinicao(documento, paginas), { capturarIds: ehMarcador });
    const novas = paginasDosArtigos(documento, resultado.posicoes);
    if (mesmasPaginas(paginas, novas)) break;
    paginas = novas;
  }
  return { buffer: resultado.buffer, paginas: paginasDosArtigos(documento, resultado.posicoes) };
}

// PDF individual do trabalho: cabeçalho com os dados da publicação e o mesmo
// corpo do trabalho nos Anais. Com as páginas da última geração dos Anais
// completos, a numeração do rodapé acompanha a paginação dos Anais.
async function gerarPdfArtigo(documento) {
  const { anais, edicao, artigo } = documento;
  const registro = criarRegistroImagens();
  const ctx = { registro };
  const paginas = artigo.paginaInicial ? { inicio: artigo.paginaInicial, fim: artigo.paginaFinal } : null;
  const licenca = anais.licencaInfo;
  const identificadores = linhaIdentificadores(anais);

  const topo = {
    margin: [0, 0, 0, 22],
    stack: [
      { text: "ANAIS", font: "Stencil", fontSize: 18, characterSpacing: 3 },
      { text: anais.titulo, font: "Archivo", fontSize: 9.5, bold: true, margin: [0, 2, 0, 0] },
      {
        text: [edicao.nome, [localEvento(edicao), periodoEvento(edicao)].filter(Boolean).join(", "), identificadores]
          .filter(Boolean)
          .join(" · "),
        style: "pequeno",
        margin: [0, 2, 0, 0],
      },
      fio(LARGURA_CONTEUDO, COR.buzio, 2.5, [0, 10, 0, 0]),
    ],
  };

  const conteudo = [topo, artigoPdf(artigo, ctx, { paginas, noSumario: false, quebraAntes: false })];
  if (licenca?.url) {
    conteudo.push({
      text: ["Licença: ", { text: `${licenca.sigla}`, link: licenca.url, color: COR.barro }, ". Os textos são de responsabilidade de seus autores e autoras."],
      style: "pequeno",
      margin: [0, 14, 0, 0],
    });
  }

  const { pageMargins, footer, background } = moldura(documento.imagens, registro, {
    topo: 56,
    cabecalhoTextual: null,
    deslocamento: paginas ? paginas.inicio - 1 : 0,
  });

  const definicao = {
    pageSize: "A4",
    pageMargins,
    info: {
      title: artigo.titulo,
      author: artigo.autores.map((autor) => autor.nome).join("; "),
      subject: anais.titulo,
      creator: "Narrativas — GPDES/UnB",
    },
    content: conteudo,
    footer,
    ...(background ? { background } : {}),
    images: registro.imagens,
    styles: ESTILOS,
    defaultStyle: { font: "Serif", fontSize: 10.5, color: COR.tinta },
  };
  const { buffer } = await renderizar(definicao);
  return buffer;
}

module.exports = { gerarPdfAnais, gerarPdfArtigo };
