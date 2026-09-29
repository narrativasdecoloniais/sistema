import { agruparAtividadesPorDia } from "@/lib/inscricao";
import {
  agruparPessoasPorTipoParticipacao,
  dividirParagrafos,
  formatarDiaAtividade,
  formatarFaixaHorario,
  formatarHoraCurta,
  formatarLocalEdicao,
  formatarPeriodoEdicao,
} from "@/lib/publico";

// Hex da paleta pública (styles/_tokens-publico.scss) — o PDF não enxerga
// as variáveis CSS, então os valores ficam repetidos aqui.
const COR = {
  tinta: "#201914",
  barro: "#9c4a2f",
  textoSuave: "#4d4842",
  linha: "#ede4d4",
};

function dataDeHoje() {
  const hoje = new Date();
  const doisDigitos = (numero) => String(numero).padStart(2, "0");
  return `${hoje.getFullYear()}-${doisDigitos(hoje.getMonth() + 1)}-${doisDigitos(hoje.getDate())}`;
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function mesmoDiaUTC(inicioIso, fimIso) {
  return new Date(inicioIso).toISOString().slice(0, 10) === new Date(fimIso).toISOString().slice(0, 10);
}

// Atividade que atravessa a meia-noite (ou dura vários dias) fica listada
// no dia em que começa, mas o fim precisa dizer em que dia cai.
function horarioAtividade(atividade) {
  const { inicioAtividade, fimAtividade } = atividade;
  if (mesmoDiaUTC(inicioAtividade, fimAtividade)) {
    return formatarFaixaHorario(inicioAtividade, fimAtividade);
  }
  return `${formatarHoraCurta(inicioAtividade)} às ${formatarHoraCurta(fimAtividade)} (${
    formatarDiaAtividade(fimAtividade).dataCurta
  })`;
}

function detalhesAtividade(atividade) {
  const partes = [atividade.tipoAtividade?.nome, atividade.local];
  if (atividade.cargaHoraria) partes.push(`${atividade.cargaHoraria}h`);
  if (atividade.exigeInscricao) {
    partes.push(
      atividade.semLimiteVagas || !atividade.vagas
        ? "Exige inscrição"
        : `Exige inscrição · ${atividade.vagas} vagas`
    );
  }
  return partes.filter(Boolean).join(" · ");
}

function blocoAtividade(atividade) {
  const conteudo = [{ text: atividade.nome, style: "nomeAtividade" }];

  const detalhes = detalhesAtividade(atividade);
  if (detalhes) conteudo.push({ text: detalhes, style: "detalhes" });

  for (const grupo of agruparPessoasPorTipoParticipacao(atividade.pessoas)) {
    conteudo.push({
      text: [
        { text: `${grupo.rotulo}: `, bold: true },
        grupo.pessoas.map((pessoa) => pessoa.nome).join(", "),
      ],
      style: "pessoas",
    });
  }

  for (const paragrafo of dividirParagrafos(atividade.descricao)) {
    conteudo.push({ text: paragrafo, style: "descricao" });
  }

  return [{ text: horarioAtividade(atividade), style: "horario" }, { stack: conteudo }];
}

function blocoDia(dia, indice) {
  return [
    {
      text: capitalizar(formatarDiaAtividade(dia.inicioIso).completo),
      style: "dia",
      // Cada dia começa numa página nova — facilita imprimir/afixar só um dia.
      pageBreak: indice > 0 ? "before" : undefined,
    },
    {
      table: {
        widths: [78, "*"],
        // dontBreakRows mantém cada atividade inteira na mesma página
        // (só quebra se uma atividade sozinha não couber numa página).
        dontBreakRows: true,
        body: dia.atividades.map(blocoAtividade),
      },
      layout: {
        hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0 : 0.5),
        vLineWidth: () => 0,
        hLineColor: () => COR.linha,
        paddingLeft: (i) => (i === 0 ? 0 : 10),
        paddingRight: () => 0,
        paddingTop: () => 9,
        paddingBottom: () => 9,
      },
    },
  ];
}

function montarDocumento(edicao, atividades) {
  const dias = agruparAtividadesPorDia(atividades);
  const periodo = formatarPeriodoEdicao(edicao.dataInicio, edicao.dataFim);
  const local = formatarLocalEdicao(edicao);

  return {
    pageSize: "A4",
    pageMargins: [48, 56, 48, 56],
    info: { title: `Programação — ${edicao.nome}` },
    content: [
      { text: "PROGRAMAÇÃO", style: "sobretitulo" },
      { text: edicao.nome, style: "tituloEdicao" },
      { text: [periodo, local].filter(Boolean).join(" · "), style: "subtitulo" },
      ...dias.flatMap(blocoDia),
    ],
    footer: (paginaAtual, totalPaginas) => ({
      columns: [
        { text: edicao.nome, style: "rodape" },
        { text: `${paginaAtual} / ${totalPaginas}`, style: "rodape", alignment: "right", width: "auto" },
      ],
      margin: [48, 20, 48, 0],
    }),
    defaultStyle: { font: "Roboto", fontSize: 9.5, color: COR.tinta, lineHeight: 1.2 },
    styles: {
      sobretitulo: { fontSize: 9, bold: true, color: COR.barro, characterSpacing: 1.5 },
      tituloEdicao: { fontSize: 18, bold: true, margin: [0, 4, 0, 4] },
      subtitulo: { fontSize: 10, color: COR.textoSuave, margin: [0, 0, 0, 20] },
      dia: { fontSize: 13, bold: true, color: COR.barro, margin: [0, 0, 0, 6] },
      horario: { fontSize: 9.5, bold: true },
      nomeAtividade: { fontSize: 10.5, bold: true },
      detalhes: { fontSize: 8.5, color: COR.textoSuave, margin: [0, 2, 0, 0] },
      pessoas: { fontSize: 8.5, margin: [0, 3, 0, 0] },
      descricao: { fontSize: 8.5, color: COR.textoSuave, margin: [0, 4, 0, 0] },
      rodape: { fontSize: 7.5, color: COR.textoSuave },
    },
  };
}

// Gera e baixa o PDF da programação completa da edição. pdfmake e as fontes
// (Roboto embutida, cobre todos os acentos) são importados sob demanda — só
// são baixados quando alguém clica no botão, como o exceljs em
// BotaoExportarTabela.
export async function baixarPdfProgramacao(edicao, atividades) {
  const [{ default: pdfMake }, { default: vfs }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  pdfMake.addVirtualFileSystem(vfs);

  const sufixo = edicao.slug || `edicao-${edicao.numero}`;
  await pdfMake.createPdf(montarDocumento(edicao, atividades)).download(
    `programacao-${sufixo}-${dataDeHoje()}.pdf`
  );
}
