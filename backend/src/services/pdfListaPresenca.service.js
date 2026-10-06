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
  letraPagina: { fontSize: 30, bold: true, color: COR.barro, lineHeight: 0.9 },
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
// separadores por letra (`separadores`, em listas longas) e uma linha por
// pessoa — quem já tem registro no sistema sai sombreado, com a situação no
// lugar da assinatura.
function tabelaPessoas(secao, { inicioNumeracao, separadores = true }) {
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
    if (separadores && letra !== letraAtual && secao.pessoas.length > 15) {
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
function tabelaEmBranco(quantidade, { titulo = "Sem inscrição", apoio } = {}) {
  const corpo = [
    [
      {
        stack: [
          { text: titulo, style: "tituloSecao" },
          {
            text: apoio || "Quem não está na lista: preencha com letra legível para a equipe registrar depois.",
            style: "detalhes",
          },
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

function abertura(lista) {
  return [
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
}

// Lista corrida: seções uma após a outra e as linhas em branco no fim.
function blocoCorrido(lista) {
  const conteudo = abertura(lista);
  let numeracao = 1;
  for (const secao of lista.secoes) {
    conteudo.push(tabelaPessoas(secao, { inicioNumeracao: numeracao }));
    numeracao += secao.pessoas.length;
  }
  if (lista.linhasEmBranco > 0) conteudo.push(tabelaEmBranco(lista.linhasEmBranco));
  return [{ rotulo: lista.rotuloCurto, conteudo }];
}

const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Uma página nova por letra inicial (só a 1ª seção — a do evento tem uma só),
// para dividir o credenciamento entre mesas: cada letra traz as próprias
// linhas em branco, e a última página recebe quem chegar sem inscrição com
// uma letra que não tem página.
function blocosPorLetra(lista) {
  const grupos = new Map();
  for (const pessoa of lista.secoes[0].pessoas) {
    const letra = letraInicial(pessoa.nome);
    if (!grupos.has(letra)) grupos.set(letra, []);
    grupos.get(letra).push(pessoa);
  }

  const blocos = [];
  let numeracao = 1;
  for (const [letra, pessoas] of grupos) {
    const nomeLetra = letra === "#" ? "Outros caracteres" : `Letra ${letra}`;
    blocos.push({
      rotulo: `${lista.rotuloCurto} · ${nomeLetra}`,
      conteudo: [
        ...(blocos.length === 0 ? abertura(lista) : []),
        { text: letra, style: "letraPagina", margin: [0, blocos.length === 0 ? 14 : 0, 0, 0] },
        tabelaPessoas({ titulo: "Inscritos", pessoas }, { inicioNumeracao: numeracao, separadores: false }),
        tabelaEmBranco(lista.porLetra.linhasEmBranco, { titulo: `Sem inscrição · ${nomeLetra}` }),
      ],
    });
    numeracao += pessoas.length;
  }

  const semPagina = [...ALFABETO].filter((letra) => !grupos.has(letra));
  blocos.push({
    rotulo: `${lista.rotuloCurto} · Outras letras`,
    conteudo: [
      ...(blocos.length === 0 ? abertura(lista) : []),
      tabelaEmBranco(lista.linhasEmBranco, {
        titulo: "Sem inscrição · outras letras",
        apoio: semPagina.length
          ? `Para quem chegar sem inscrição com nome iniciado por ${semPagina.join(", ")} (letras sem página nesta lista). Preencha com letra legível.`
          : "Para quem chegar sem inscrição e não couber na página da própria letra. Preencha com letra legível.",
      }),
    ],
  });
  return blocos;
}

function blocosDaLista(lista) {
  return lista.porLetra ? blocosPorLetra(lista) : blocoCorrido(lista);
}

// Numeração por lista ("Página 2 de 3" da própria atividade), não do arquivo.
// `paginasDaLista` vem de uma primeira diagramação: o pdfmake desenha os
// rodapés antes de expor as páginas de cada nó.
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

// `paginasPorLista`: índice da lista -> páginas dela (todas as seções).
function montarDefinicao(listas, titulo, paginasPorLista) {
  // Cada section começa numa página nova.
  const secoes = listas.flatMap((lista, indiceLista) =>
    blocosDaLista(lista).map((bloco, indiceBloco) => ({
      section: [{ id: `lista-${indiceLista}-${indiceBloco}`, stack: bloco.conteudo }],
      footer: rodapePorLista(paginasPorLista?.get(indiceLista)),
      header: () => ({
        columns: [
          { text: bloco.rotulo, style: "rodape", bold: true },
          { text: lista.geradaEm, style: "rodape", alignment: "right" },
        ],
        margin: [MARGENS[0], 28, MARGENS[2], 0],
      }),
    }))
  );
  return {
    pageSize: "A4",
    pageMargins: MARGENS,
    info: { title: titulo, creator: "Narrativas — GPDES/UnB" },
    content: secoes,
    styles: ESTILOS,
    defaultStyle: { font: "Archivo", fontSize: 9, color: COR.tinta },
  };
}

// `listas`: [{ evento, titulo, rotuloCurto, detalhes, instrucoes, geradaEm,
// secoes: [{ titulo, pessoas: [{ nome, documento, registrado }] }],
// linhasEmBranco, porLetra?: { linhasEmBranco } }]
async function gerarPdfListasPresenca(listas, { titulo }) {
  // Uma lista só: a numeração do arquivo já é a dela.
  if (listas.length === 1) return pdfmake.createPdf(aplicarFontes(montarDefinicao(listas, titulo))).getBuffer();

  const paginasPorLista = new Map();
  const medicao = montarDefinicao(listas, titulo);
  medicao.pageBreakBefore = (no) => {
    const [, indiceLista] = /^lista-(\d+)-\d+$/.exec(no.id || "") || [];
    if (indiceLista !== undefined) {
      const indice = Number(indiceLista);
      paginasPorLista.set(indice, [...(paginasPorLista.get(indice) || []), ...no.pageNumbers]);
    }
    return false;
  };
  await pdfmake.createPdf(aplicarFontes(medicao)).getBuffer();
  return pdfmake.createPdf(aplicarFontes(montarDefinicao(listas, titulo, paginasPorLista))).getBuffer();
}

module.exports = { gerarPdfListasPresenca };
