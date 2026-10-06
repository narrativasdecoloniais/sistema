const pdfmake = require("pdfmake");
const { FONTES, PASTAS_FONTES, aplicarFontes } = require("../utils/fontesPdf");

// Listas de presença impressas (contingência para quando o sistema ou a
// internet caírem no dia): A4 retrato, uma lista por seção — o "Baixar todas"
// das atividades junta várias no mesmo arquivo, cada uma começando numa página
// nova e com o próprio cabeçalho, para as folhas soltas não se misturarem.
// Puro — recebe as listas já montadas por credenciamento.service.js.

pdfmake.setFonts(FONTES);
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy((caminho) => PASTAS_FONTES.some((pasta) => caminho.startsWith(pasta)));

const COR = {
  tinta: "#201914",
  suave: "#6b625a",
  borda: "#cfc6bb",
  registrado: "#efebe5",
  barro: "#9c4a2f",
};

const MARGENS = [36, 64, 36, 44];

const ESTILOS = {
  evento: { fontSize: 8, bold: true, color: COR.barro, characterSpacing: 0.8 },
  titulo: { fontSize: 15, bold: true, margin: [0, 2, 0, 2] },
  detalhes: { fontSize: 9, color: COR.suave },
  instrucoes: { fontSize: 8.5, color: COR.tinta, lineHeight: 1.2 },
  tituloSecao: { fontSize: 10, bold: true, margin: [0, 2, 0, 2] },
  cabecalhoColuna: { fontSize: 7.5, bold: true, color: COR.suave },
  letra: { fontSize: 8, bold: true, color: COR.barro },
  celula: { fontSize: 9 },
  situacao: { fontSize: 7.5, bold: true, color: COR.suave },
  rodape: { fontSize: 7.5, color: COR.suave },
};

const SEM_ACENTO = /[\u0300-\u036f]/g;
function letraInicial(nome) {
  const letra = String(nome || "").normalize("NFD").replace(SEM_ACENTO, "").trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(letra) ? letra : "#";
}

// Fios horizontais finos, sem fio acima do título da seção (1ª linha); a
// altura da linha (espaço para assinar) vem do padding.
const LAYOUT_TABELA = {
  hLineWidth: (i, no) => (i === 0 ? 0 : i === 1 || i === no.table.body.length ? 0.8 : 0.4),
  vLineWidth: () => 0,
  hLineColor: () => COR.borda,
  paddingLeft: () => 4,
  paddingRight: () => 4,
  paddingTop: (i) => (i === 0 ? 0 : 6),
  paddingBottom: (i) => (i === 0 ? 4 : 6),
};

// Uma seção de inscritos: título (repetido em cada página, com as colunas),
// separadores por letra e uma linha por pessoa — quem já tem registro no
// sistema sai sombreado, com a situação no lugar da assinatura.
function tabelaPessoas(secao, { inicioNumeracao }) {
  const larguras = [20, "*", 96, 150];
  const corpo = [
    [{ text: `${secao.titulo} (${secao.pessoas.length})`, style: "tituloSecao", colSpan: 4, border: [false, false, false, false] }, {}, {}, {}],
    [
      { text: "Nº", style: "cabecalhoColuna" },
      { text: "NOME", style: "cabecalhoColuna" },
      { text: "CPF / DOCUMENTO", style: "cabecalhoColuna" },
      { text: "ASSINATURA", style: "cabecalhoColuna" },
    ],
  ];

  if (secao.pessoas.length === 0) {
    corpo.push([{ text: "Ninguém nesta lista.", style: "detalhes", colSpan: 4 }, {}, {}, {}]);
  }

  let letraAtual = null;
  secao.pessoas.forEach((pessoa, indice) => {
    const letra = letraInicial(pessoa.nome);
    if (letra !== letraAtual && secao.pessoas.length > 15) {
      corpo.push([{ text: letra, style: "letra", colSpan: 4, margin: [0, -4, 0, -4] }, {}, {}, {}]);
    }
    letraAtual = letra;
    const fundo = pessoa.registrado ? COR.registrado : null;
    corpo.push([
      { text: String(inicioNumeracao + indice), style: "celula", color: COR.suave, fillColor: fundo },
      { text: pessoa.nome, style: "celula", fillColor: fundo },
      { text: pessoa.documento || "—", style: "celula", fillColor: fundo },
      { text: pessoa.registrado || "", style: "situacao", fillColor: fundo },
    ]);
  });

  return {
    table: { headerRows: 2, keepWithHeaderRows: 1, dontBreakRows: true, widths: larguras, body: corpo },
    layout: LAYOUT_TABELA,
    margin: [0, 10, 0, 0],
  };
}

// Linhas em branco para quem aparecer sem inscrição.
function tabelaEmBranco(quantidade) {
  const corpo = [
    [
      {
        stack: [
          { text: "Sem inscrição", style: "tituloSecao" },
          { text: "Quem não está na lista: preencha com letra legível para a equipe registrar depois.", style: "detalhes" },
        ],
        colSpan: 4,
        border: [false, false, false, false],
      },
      {},
      {},
      {},
    ],
    [
      { text: "NOME COMPLETO", style: "cabecalhoColuna" },
      { text: "CPF / DOCUMENTO", style: "cabecalhoColuna" },
      { text: "E-MAIL", style: "cabecalhoColuna" },
      { text: "ASSINATURA", style: "cabecalhoColuna" },
    ],
  ];
  for (let i = 0; i < quantidade; i += 1) corpo.push([{ text: " " }, { text: " " }, { text: " " }, { text: " " }]);
  return {
    table: { headerRows: 2, keepWithHeaderRows: 1, dontBreakRows: true, widths: ["*", 92, 130, 120], body: corpo },
    layout: { ...LAYOUT_TABELA, paddingTop: (i) => (i === 0 ? 0 : 9), paddingBottom: (i) => (i === 0 ? 4 : 9) },
    margin: [0, 16, 0, 0],
  };
}

function conteudoLista(lista) {
  const conteudo = [
    { text: lista.evento.toUpperCase(), style: "evento" },
    { text: lista.titulo, style: "titulo" },
    lista.detalhes ? { text: lista.detalhes, style: "detalhes" } : null,
    {
      table: {
        widths: ["*"],
        body: [[{ text: lista.instrucoes, style: "instrucoes", margin: [6, 5, 6, 5] }]],
      },
      layout: { hLineWidth: () => 0.6, vLineWidth: () => 0.6, hLineColor: () => COR.borda, vLineColor: () => COR.borda },
      margin: [0, 10, 0, 0],
    },
  ].filter(Boolean);

  let numeracao = 1;
  for (const secao of lista.secoes) {
    conteudo.push(tabelaPessoas(secao, { inicioNumeracao: numeracao }));
    numeracao += secao.pessoas.length;
  }
  if (lista.linhasEmBranco > 0) conteudo.push(tabelaEmBranco(lista.linhasEmBranco));
  return conteudo;
}

// Numeração por lista ("Página 2 de 3" da própria atividade), não do arquivo.
// `paginas` (id da lista -> páginas dela) vem de uma primeira diagramação:
// o pdfmake desenha os rodapés antes de expor as páginas de cada nó.
function rodapePorLista(paginasDaLista) {
  return (paginaAtual, totalPaginas) => {
    const indice = paginasDaLista ? paginasDaLista.indexOf(paginaAtual) : -1;
    return {
      text: indice >= 0 ? `Página ${indice + 1} de ${paginasDaLista.length}` : `Página ${paginaAtual} de ${totalPaginas}`,
      style: "rodape",
      alignment: "right",
      margin: [MARGENS[0], 14, MARGENS[2], 0],
    };
  };
}

function montarDefinicao(listas, titulo, paginas) {
  return {
    pageSize: "A4",
    pageMargins: MARGENS,
    info: { title: titulo, creator: "Narrativas — GPDES/UnB" },
    // Cada section começa numa página nova.
    content: listas.map((lista, indice) => ({
      section: [{ id: `lista-${indice}`, stack: conteudoLista(lista) }],
      footer: rodapePorLista(paginas?.get(`lista-${indice}`)),
      header: () => ({
        columns: [
          { text: lista.rotuloCurto, style: "rodape", bold: true },
          { text: lista.geradaEm, style: "rodape", alignment: "right" },
        ],
        margin: [MARGENS[0], 28, MARGENS[2], 0],
      }),
    })),
    styles: ESTILOS,
    defaultStyle: { font: "Archivo", fontSize: 9, color: COR.tinta },
  };
}

// `listas`: [{ evento, titulo, rotuloCurto, detalhes, instrucoes, geradaEm,
// secoes: [{ titulo, pessoas: [{ nome, documento, registrado }] }], linhasEmBranco }]
async function gerarPdfListasPresenca(listas, { titulo }) {
  // Uma lista só: a numeração do arquivo já é a dela.
  if (listas.length === 1) return pdfmake.createPdf(aplicarFontes(montarDefinicao(listas, titulo))).getBuffer();

  const paginas = new Map();
  const medicao = montarDefinicao(listas, titulo);
  medicao.pageBreakBefore = (no) => {
    if (no.id?.startsWith("lista-")) paginas.set(no.id, no.pageNumbers);
    return false;
  };
  await pdfmake.createPdf(aplicarFontes(medicao)).getBuffer();
  return pdfmake.createPdf(aplicarFontes(montarDefinicao(listas, titulo, paginas))).getBuffer();
}

module.exports = { gerarPdfListasPresenca };
