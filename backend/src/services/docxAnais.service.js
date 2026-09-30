const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ExternalHyperlink,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  TableOfContents,
  Header,
  Footer,
  PageNumber,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  LevelFormat,
  Bookmark,
  PageReference,
  ShadingType,
  convertMillimetersToTwip,
} = require("docx");
const { citacaoAbnt } = require("../utils/citacao");
const { linhaIdentificadores, periodoEvento, localEvento } = require("../utils/formatacaoAnais");

// Anais em Word (.docx), mesma estrutura do PDF (pdfAnais.service.js) a
// partir do mesmo modelo neutro. Diferenças inerentes ao Word:
// - sumário, índice de autores e páginas do "Como citar" são campos
//   (TOC/PAGEREF) — o Word pede para atualizá-los ao abrir o arquivo;
// - fontes padrão de sistema (Times New Roman no corpo, Arial nos títulos),
//   já que o .docx é para edição/diagramação posterior e o Word não embute
//   as fontes do site.

const COR = {
  tinta: "201914",
  barro: "9C4A2F",
  buzio: "EDB153",
  areia: "EDE4D4",
  papel: "FAF6EE",
  textoSuave: "4D4842",
  linha: "D9CCB6",
};

const FONTE_CORPO = "Times New Roman";
const FONTE_TITULO = "Arial";

// A4 com margens ABNT (3 cm sup./esq., 2 cm inf./dir.).
const PAGINA = {
  size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
  margin: {
    top: convertMillimetersToTwip(30),
    left: convertMillimetersToTwip(30),
    bottom: convertMillimetersToTwip(20),
    right: convertMillimetersToTwip(20),
    header: convertMillimetersToTwip(12),
    footer: convertMillimetersToTwip(10),
  },
};
// Largura útil em px (96 dpi) para as imagens: 160 mm.
const LARGURA_CONTEUDO_PX = Math.round((160 / 25.4) * 96);
const ALTURA_MAX_IMAGEM_PX = Math.round((120 / 25.4) * 96);

// ---------------------------------------------------------------------------
// Rich text → docx
// ---------------------------------------------------------------------------

function runs(trechos, base = {}) {
  const resultado = [];
  for (const trecho of trechos) {
    // "\n" do <br> vira quebra de linha dentro do mesmo parágrafo.
    const partes = trecho.texto.split("\n");
    partes.forEach((parte, indice) => {
      const opcoes = {
        ...base,
        text: parte,
        bold: trecho.negrito || base.bold,
        italics: trecho.italico || base.italics,
        break: indice > 0 ? 1 : undefined,
      };
      if (trecho.link) {
        resultado.push(
          new ExternalHyperlink({
            link: trecho.link,
            children: [new TextRun({ ...opcoes, style: "Hyperlink", color: COR.barro, underline: {} })],
          })
        );
      } else {
        resultado.push(new TextRun(opcoes));
      }
    });
  }
  return resultado;
}

function imagemDocx(bloco) {
  if (bloco.ausente || !bloco.dados) return [];
  let largura = Math.min(LARGURA_CONTEUDO_PX, Math.round((bloco.largura * 96) / 150));
  let altura = Math.round((bloco.altura / bloco.largura) * largura);
  if (altura > ALTURA_MAX_IMAGEM_PX) {
    largura = Math.round((ALTURA_MAX_IMAGEM_PX / altura) * largura);
    altura = ALTURA_MAX_IMAGEM_PX;
  }
  const paragrafos = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: bloco.alt ? 40 : 160 },
      keepNext: Boolean(bloco.alt),
      children: [
        new ImageRun({
          type: bloco.formato === "jpg" ? "jpg" : "png",
          data: bloco.dados,
          transformation: { width: largura, height: altura },
          altText: bloco.alt ? { name: "Imagem", description: bloco.alt, title: bloco.alt } : undefined,
        }),
      ],
    }),
  ];
  if (bloco.alt) paragrafos.push(new Paragraph({ style: "Legenda", children: [new TextRun(bloco.alt)] }));
  return paragrafos;
}

function tabelaDocx(bloco, ctx) {
  const colunas = Math.max(
    ...bloco.linhas.map((linha) => linha.reduce((total, celula) => total + celula.colspan, 0))
  );
  const largura = Math.floor(100 / Math.max(colunas, 1));
  const linhas = bloco.linhas.map((linha, indiceLinha) => {
    const cabecalho = linha.every((celula) => celula.cabecalho) && indiceLinha < bloco.linhas.length - 1;
    return new TableRow({
      tableHeader: cabecalho,
      cantSplit: true,
      children: linha.map(
        (celula) =>
          new TableCell({
            columnSpan: celula.colspan > 1 ? celula.colspan : undefined,
            rowSpan: celula.rowspan > 1 ? Math.min(celula.rowspan, bloco.linhas.length - indiceLinha) : undefined,
            shading: celula.cabecalho ? { type: ShadingType.CLEAR, fill: COR.areia, color: "auto" } : undefined,
            width: { size: largura * celula.colspan, type: WidthType.PERCENTAGE },
            margins: { top: 60, bottom: 60, left: 90, right: 90 },
            children: blocosDocx(celula.blocos, { ...ctx, estilo: celula.cabecalho ? "CelulaCabecalho" : "Celula" }),
          })
      ),
    });
  });
  const borda = { style: BorderStyle.SINGLE, size: 4, color: COR.linha };
  return [
    new Table({
      rows: linhas,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: borda, bottom: borda, left: borda, right: borda, insideHorizontal: borda, insideVertical: borda },
    }),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
  ];
}

function listaDocx(bloco, ctx, nivel = 0) {
  const instancia = bloco.ordenada ? ctx.novaInstanciaLista() : null;
  const paragrafos = [];
  for (const item of bloco.itens) {
    item.forEach((sub, indice) => {
      if (sub.tipo === "lista") {
        paragrafos.push(...listaDocx(sub, ctx, Math.min(nivel + 1, 3)));
      } else if (sub.tipo === "paragrafo" && indice === 0) {
        paragrafos.push(
          new Paragraph({
            style: ctx.estilo,
            alignment: AlignmentType.LEFT,
            ...(bloco.ordenada
              ? { numbering: { reference: "lista-numerada", level: nivel, instance: instancia } }
              : { bullet: { level: nivel } }),
            children: runs(sub.trechos),
          })
        );
      } else {
        paragrafos.push(...blocoDocx(sub, ctx));
      }
    });
  }
  return paragrafos;
}

function blocoDocx(bloco, ctx) {
  switch (bloco.tipo) {
    case "paragrafo":
      return [new Paragraph({ style: ctx.estilo, children: runs(bloco.trechos) })];
    case "titulo":
      return [new Paragraph({ style: bloco.nivel === 2 ? "Subtitulo2" : "Subtitulo3", children: runs(bloco.trechos) })];
    case "lista":
      return listaDocx(bloco, ctx);
    case "imagem":
      return imagemDocx(bloco);
    case "tabela":
      return tabelaDocx(bloco, ctx);
    default:
      return [];
  }
}

function blocosDocx(blocos, ctx) {
  const resultado = blocos.flatMap((bloco) => blocoDocx(bloco, ctx));
  // Célula de tabela precisa de ao menos um parágrafo.
  return resultado.length ? resultado : [new Paragraph({ style: ctx.estilo, children: [] })];
}

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

function paragrafoVazio(antes = 0) {
  return new Paragraph({ spacing: { before: antes }, children: [] });
}

function capa(documento) {
  const { anais, edicao, logo } = documento;
  const filhos = [];
  if (logo) {
    const altura = 220;
    const largura = Math.round((logo.largura / logo.altura) * altura);
    filhos.push(
      new Paragraph({
        spacing: { before: 600, after: 600 },
        children: [new ImageRun({ type: "png", data: logo.dados, transformation: { width: largura, height: altura } })],
      })
    );
  } else {
    filhos.push(paragrafoVazio(3600));
  }
  filhos.push(
    new Paragraph({
      spacing: { after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 24, color: COR.buzio, space: 8 } },
      children: [new TextRun({ text: "ANAIS", font: FONTE_TITULO, bold: true, size: 96, color: COR.tinta, characterSpacing: 60 })],
    }),
    new Paragraph({
      spacing: { before: 240 },
      children: [new TextRun({ text: anais.titulo, font: FONTE_TITULO, bold: true, size: 40, color: COR.tinta })],
    })
  );
  if (anais.subtitulo) {
    filhos.push(
      new Paragraph({
        spacing: { before: 120 },
        children: [new TextRun({ text: anais.subtitulo, font: FONTE_TITULO, size: 26, color: COR.textoSuave })],
      })
    );
  }
  filhos.push(
    new Paragraph({
      spacing: { before: 360 },
      children: [
        new TextRun({
          text: [localEvento(edicao), periodoEvento(edicao)].filter(Boolean).join(" · "),
          font: FONTE_TITULO,
          size: 20,
          color: COR.textoSuave,
        }),
      ],
    })
  );
  if (linhaIdentificadores(anais)) {
    filhos.push(
      new Paragraph({
        spacing: { before: 2400 },
        children: [new TextRun({ text: linhaIdentificadores(anais), font: FONTE_TITULO, bold: true, size: 18, color: COR.barro })],
      })
    );
  }
  return { properties: { page: PAGINA }, children: filhos };
}

function folhaDeRosto(documento) {
  const { anais, edicao } = documento;
  const centro = (texto, opcoes = {}, espaco = {}) =>
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: espaco, children: [new TextRun({ text: texto, ...opcoes })] });
  const filhos = [];
  if (anais.organizadores?.length) {
    anais.organizadores.forEach((nome) => filhos.push(centro(nome, { font: FONTE_TITULO, size: 22 })));
    filhos.push(
      centro(anais.organizadores.length > 1 ? "(Organizadores)" : "(Organização)", { font: FONTE_TITULO, size: 18, color: COR.textoSuave }, { before: 60 })
    );
  }
  filhos.push(centro(anais.titulo, { font: FONTE_TITULO, bold: true, size: 36 }, { before: 3600 }));
  if (anais.subtitulo) filhos.push(centro(anais.subtitulo, { font: FONTE_TITULO, size: 24, color: COR.textoSuave }, { before: 120 }));
  filhos.push(centro(edicao.nome, { font: FONTE_CORPO, italics: true, size: 22 }, { before: 480 }));
  filhos.push(centro([localEvento(edicao), periodoEvento(edicao)].filter(Boolean).join(", "), { font: FONTE_CORPO, size: 20 }, { before: 60 }));
  const imprenta = [anais.localPublicacao, anais.editora, anais.anoPublicacao].filter(Boolean);
  if (imprenta.length) {
    filhos.push(paragrafoVazio(3600));
    imprenta.forEach((linha) => filhos.push(centro(String(linha), { font: FONTE_TITULO, size: 20 })));
  }
  return { properties: { page: PAGINA }, children: filhos };
}

function creditos(documento) {
  const { anais } = documento;
  const filhos = [
    new Paragraph({ children: [new TextRun({ text: anais.titulo, font: FONTE_TITULO, bold: true, size: 20 })] }),
  ];
  if (linhaIdentificadores(anais)) filhos.push(new Paragraph({ style: "Pequeno", children: [new TextRun(linhaIdentificadores(anais))] }));
  const licenca = anais.licencaInfo;
  if (licenca) {
    filhos.push(
      new Paragraph({
        style: "Pequeno",
        spacing: { before: 240 },
        children: licenca.url
          ? [
              new TextRun("Esta obra está licenciada sob a licença "),
              new ExternalHyperlink({
                link: licenca.url,
                children: [new TextRun({ text: `${licenca.nome} (${licenca.sigla})`, style: "Hyperlink", color: COR.barro })],
              }),
              new TextRun(". Os textos são de responsabilidade de seus autores e autoras."),
            ]
          : [new TextRun("Todos os direitos reservados. Os textos são de responsabilidade de seus autores e autoras.")],
      })
    );
  }
  if (anais.fichaCatalografica) {
    filhos.push(
      new Paragraph({
        style: "Pequeno",
        alignment: AlignmentType.CENTER,
        spacing: { before: 720, after: 120 },
        children: [new TextRun({ text: "Dados Internacionais de Catalogação na Publicação (CIP)", bold: true })],
      })
    );
    const borda = { style: BorderStyle.SINGLE, size: 6, color: COR.tinta };
    filhos.push(
      new Table({
        width: { size: 80, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        borders: { top: borda, bottom: borda, left: borda, right: borda },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                margins: { top: 160, bottom: 160, left: 200, right: 200 },
                children: anais.fichaCatalografica.split("\n").map(
                  (linha) =>
                    new Paragraph({
                      children: [new TextRun({ text: linha.replace(/ /g, " "), font: FONTE_TITULO, size: 17 })],
                    })
                ),
              }),
            ],
          }),
        ],
      })
    );
  }
  return { properties: { page: PAGINA }, children: filhos };
}

function expediente(documento) {
  if (!documento.expediente?.length) return null;
  const filhos = [new Paragraph({ style: "TituloPretextual", children: [new TextRun("Expediente")] })];
  for (const grupo of documento.expediente) {
    filhos.push(new Paragraph({ style: "Sobretitulo", spacing: { before: 280 }, children: [new TextRun(grupo.nome.toLocaleUpperCase("pt-BR"))] }));
    for (const lista of grupo.listas) {
      filhos.push(
        new Paragraph({
          spacing: { before: 200, after: 40 },
          children: [new TextRun({ text: lista.nome, font: FONTE_TITULO, bold: true, size: 20 })],
        })
      );
      lista.itens.forEach((item) => filhos.push(new Paragraph({ children: [new TextRun({ text: item, font: FONTE_CORPO, size: 22 })] })));
    }
  }
  return { properties: { page: PAGINA }, children: filhos };
}

function apresentacao(documento, ctx) {
  if (!documento.apresentacao?.length) return null;
  return {
    properties: { page: PAGINA },
    children: [
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Apresentação")] }),
      ...blocosDocx(documento.apresentacao, { ...ctx, estilo: "Corpo" }),
    ],
  };
}

function sumario() {
  return {
    properties: { page: PAGINA },
    children: [
      new Paragraph({ style: "TituloPretextual", children: [new TextRun("Sumário")] }),
      new TableOfContents("Sumário", { hyperlink: true, headingStyleRange: "1-3" }),
    ],
  };
}

function autoresRuns(autores) {
  const resultado = [];
  autores.forEach((autor, indice) => {
    if (indice > 0) resultado.push(new TextRun("; "));
    resultado.push(new TextRun(autor.nome));
    if (autor.orcid) {
      const orcid = autor.orcid.replace(/^https?:\/\/orcid\.org\//i, "");
      resultado.push(
        new ExternalHyperlink({
          link: `https://orcid.org/${orcid}`,
          children: [new TextRun({ text: ` (ORCID ${orcid})`, size: 17, color: COR.textoSuave })],
        })
      );
    }
  });
  return resultado;
}

// "Como citar": páginas por campo PAGEREF (marcadores ini/fim do trabalho).
function caixaCitacao(artigo, marcadores) {
  const trechos = citacaoAbnt({ ...artigo.citacao, paginaInicial: null, paginaFinal: null });
  const texto = trechos.map((trecho) => ({ ...trecho, texto: trecho.texto.replace(/ Disponível em: .*$/, "") }));
  const ultimo = texto[texto.length - 1];
  // Encaixa "p. X-Y." logo depois da imprenta (antes de ISSN/ISBN).
  const [antes, ...depois] = ultimo.texto.split(/(?= ISSN| ISBN)/);
  const filhosTexto = [
    ...texto.slice(0, -1).map((trecho) => new TextRun({ text: trecho.texto, bold: trecho.destaque })),
    new TextRun(`${antes} p. `),
    new PageReference(marcadores.inicio),
    new TextRun("-"),
    new PageReference(marcadores.fim),
    new TextRun(`.${depois.join("")}`),
  ];

  const celula = [
    new Paragraph({
      style: "Sobretitulo",
      keepNext: true,
      children: [new Bookmark({ id: marcadores.fim, children: [new TextRun("COMO CITAR ESTE TRABALHO")] })],
    }),
    new Paragraph({ style: "Citacao", keepNext: Boolean(artigo.citacao.url), children: filhosTexto }),
  ];
  if (artigo.citacao.url) {
    celula.push(
      new Paragraph({
        style: "Pequeno",
        spacing: { before: 80 },
        children: [
          new ExternalHyperlink({
            link: artigo.citacao.url,
            children: [new TextRun({ text: artigo.citacao.url, style: "Hyperlink", color: COR.barro })],
          }),
        ],
      })
    );
  }
  const nenhuma = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return [
    paragrafoVazio(120),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 12, color: COR.buzio },
        bottom: nenhuma,
        left: nenhuma,
        right: nenhuma,
        insideHorizontal: nenhuma,
        insideVertical: nenhuma,
      },
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              shading: { type: ShadingType.CLEAR, fill: COR.papel, color: "auto" },
              margins: { top: 140, bottom: 160, left: 200, right: 200 },
              children: celula,
            }),
          ],
        }),
      ],
    }),
  ];
}

function rotuloArea(artigo) {
  return [artigo.modalidade?.nome, artigo.area?.titulo].filter(Boolean).join(" · ").toLocaleUpperCase("pt-BR");
}

function artigoDocx(artigo, ctx, { quebraAntes, semRotulo }) {
  const marcadores = ctx.marcadores.get(artigo.id);
  const filhos = [];
  if (!semRotulo) {
    filhos.push(
      new Paragraph({ style: "Sobretitulo", pageBreakBefore: quebraAntes, keepNext: true, children: [new TextRun(rotuloArea(artigo))] })
    );
  }
  filhos.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      pageBreakBefore: quebraAntes && semRotulo,
      children: [new Bookmark({ id: marcadores.inicio, children: [new TextRun(artigo.titulo)] })],
    }),
    new Paragraph({
      style: "Autores",
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COR.linha, space: 8 } },
      children: autoresRuns(artigo.autores),
    }),
    new Paragraph({ style: "Rotulo", children: [new TextRun("RESUMO")] }),
    ...blocosDocx(artigo.resumo, { ...ctx, estilo: "Corpo" })
  );
  if (artigo.referencias.length) {
    filhos.push(
      new Paragraph({ style: "Rotulo", children: [new TextRun("REFERÊNCIAS")] }),
      ...blocosDocx(artigo.referencias, { ...ctx, estilo: "Referencia" })
    );
  }
  filhos.push(...caixaCitacao(artigo, marcadores));
  return filhos;
}

function textuais(documento, ctx) {
  const filhos = [];
  documento.secoes.forEach((secao, indiceSecao) => {
    filhos.push(
      new Paragraph({ style: "Sobretitulo", pageBreakBefore: indiceSecao > 0, spacing: { before: 3600 }, children: [new TextRun("MODALIDADE")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(secao.modalidade.nome)] }),
      new Paragraph({
        style: "Pequeno",
        children: [new TextRun(`${secao.areas.reduce((total, area) => total + area.artigos.length, 0)} trabalhos`)],
      })
    );
    for (const area of secao.areas) {
      area.artigos.forEach((artigo, indiceArtigo) => {
        if (indiceArtigo === 0 && area.titulo) {
          filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_2, pageBreakBefore: true, children: [new TextRun(area.titulo)] }));
        }
        filhos.push(
          ...artigoDocx(artigo, ctx, {
            quebraAntes: indiceArtigo > 0 || !area.titulo,
            semRotulo: indiceArtigo === 0 && Boolean(area.titulo),
          })
        );
      });
    }
  });

  filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun("Índice de autores")] }));
  for (const autor of documento.autores) {
    const paginas = [];
    autor.artigos.forEach((artigoId, indice) => {
      if (indice > 0) paginas.push(new TextRun(", "));
      paginas.push(new PageReference(ctx.marcadores.get(artigoId).inicio));
    });
    filhos.push(new Paragraph({ style: "Indice", children: [new TextRun(`${autor.nome}  `), ...paginas] }));
  }
  return filhos;
}

function cabecalho(anais) {
  return new Header({
    children: [
      new Paragraph({
        style: "Cabecalho",
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COR.linha, space: 4 } },
        tabStops: [{ type: "right", position: convertMillimetersToTwip(160) }],
        children: [new TextRun(anais.titulo), new TextRun({ text: `\t${linhaIdentificadores(anais)}` })],
      }),
    ],
  });
}

function rodape() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], font: FONTE_TITULO, size: 16, color: COR.textoSuave })],
      }),
    ],
  });
}

const ESTILOS = {
  default: {
    document: { run: { font: FONTE_CORPO, size: 22, color: COR.tinta } },
    heading1: {
      run: { font: FONTE_TITULO, size: 40, bold: true, color: COR.tinta },
      paragraph: { spacing: { before: 120, after: 240 }, keepNext: true },
    },
    heading2: {
      run: { font: FONTE_TITULO, size: 24, bold: true, color: COR.barro },
      paragraph: {
        spacing: { after: 240 },
        keepNext: true,
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COR.barro, space: 4 } },
      },
    },
    heading3: {
      run: { font: FONTE_TITULO, size: 30, bold: true, color: COR.tinta },
      paragraph: { spacing: { before: 80, after: 160 }, keepNext: true },
    },
  },
  paragraphStyles: [
    { id: "Corpo", name: "Corpo", basedOn: "Normal", run: { font: FONTE_CORPO, size: 22 }, paragraph: { alignment: AlignmentType.JUSTIFIED, spacing: { after: 140, line: 330 } } },
    { id: "Referencia", name: "Referência", basedOn: "Normal", run: { font: FONTE_CORPO, size: 20 }, paragraph: { spacing: { after: 120, line: 260 } } },
    { id: "Autores", name: "Autores", basedOn: "Normal", run: { font: FONTE_CORPO, size: 22 }, paragraph: { spacing: { after: 200 } } },
    { id: "Rotulo", name: "Rótulo", basedOn: "Normal", run: { font: FONTE_TITULO, size: 16, bold: true, color: COR.barro, characterSpacing: 24 }, paragraph: { spacing: { before: 280, after: 120 }, keepNext: true } },
    { id: "Sobretitulo", name: "Sobretítulo", basedOn: "Normal", run: { font: FONTE_TITULO, size: 16, bold: true, color: COR.barro, characterSpacing: 24 }, paragraph: { spacing: { after: 80 }, keepNext: true } },
    { id: "TituloPretextual", name: "Título pré-textual", basedOn: "Normal", run: { font: FONTE_TITULO, size: 40, bold: true }, paragraph: { spacing: { after: 360 } } },
    { id: "Subtitulo2", name: "Subtítulo 2", basedOn: "Normal", run: { font: FONTE_TITULO, size: 26, bold: true }, paragraph: { spacing: { before: 200, after: 120 }, keepNext: true } },
    { id: "Subtitulo3", name: "Subtítulo 3", basedOn: "Normal", run: { font: FONTE_TITULO, size: 22, bold: true }, paragraph: { spacing: { before: 160, after: 80 }, keepNext: true } },
    { id: "Celula", name: "Célula", basedOn: "Normal", run: { font: FONTE_CORPO, size: 17 } },
    { id: "CelulaCabecalho", name: "Célula cabeçalho", basedOn: "Normal", run: { font: FONTE_TITULO, size: 17, bold: true } },
    { id: "Legenda", name: "Legenda", basedOn: "Normal", run: { font: FONTE_TITULO, size: 16, italics: true, color: COR.textoSuave }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 200 } } },
    { id: "Citacao", name: "Citação", basedOn: "Normal", run: { font: FONTE_CORPO, size: 19 }, paragraph: { spacing: { line: 276 } } },
    { id: "Pequeno", name: "Pequeno", basedOn: "Normal", run: { font: FONTE_TITULO, size: 17, color: COR.textoSuave } },
    { id: "Cabecalho", name: "Cabeçalho dos Anais", basedOn: "Normal", run: { font: FONTE_TITULO, size: 15, color: COR.textoSuave } },
    { id: "Indice", name: "Índice", basedOn: "Normal", run: { font: FONTE_CORPO, size: 20 }, paragraph: { spacing: { after: 40 } } },
  ],
};

const NUMERACAO = {
  config: [
    {
      reference: "lista-numerada",
      levels: [0, 1, 2, 3].map((nivel) => ({
        level: nivel,
        format: [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN, LevelFormat.DECIMAL][nivel],
        text: `%${nivel + 1}.`,
        alignment: AlignmentType.START,
        style: { paragraph: { indent: { left: 720 * (nivel + 1), hanging: 360 } } },
      })),
    },
  ],
};

async function gerarDocxAnais(documento) {
  let contadorLista = 0;
  // Nomes de marcador do Word: letras/dígitos/_ e até 40 caracteres.
  const marcadores = new Map(
    documento.artigos.map((artigo, indice) => [artigo.id, { inicio: `trab${indice + 1}_ini`, fim: `trab${indice + 1}_fim` }])
  );
  const ctx = { marcadores, novaInstanciaLista: () => (contadorLista += 1) };

  const secoesPretextuais = [
    capa(documento),
    folhaDeRosto(documento),
    creditos(documento),
    expediente(documento),
    apresentacao(documento, ctx),
    sumario(),
  ].filter(Boolean);

  const doc = new Document({
    creator: documento.anais.editora || "Narrativas — GPDES/UnB",
    title: documento.anais.titulo,
    subject: documento.edicao.nome,
    description: "Anais gerados pelo sistema do evento Narrativas (GPDES/UnB).",
    features: { updateFields: true },
    styles: ESTILOS,
    numbering: NUMERACAO,
    sections: [
      ...secoesPretextuais,
      {
        properties: { page: PAGINA },
        headers: { default: cabecalho(documento.anais) },
        footers: { default: rodape() },
        children: textuais(documento, ctx),
      },
    ],
  });
  return Packer.toBuffer(doc);
}

module.exports = { gerarDocxAnais };
