// Textos comuns ao PDF (pdfAnais.service.js) e ao Word (docxAnais.service.js)
// dos Anais.

// Espaço inquebrável: "ISSN" nunca fica numa linha e o número na outra.
function linhaIdentificadores(anais) {
  return [anais.issn && `ISSN ${anais.issn}`, anais.isbn && `ISBN ${anais.isbn}`]
    .filter(Boolean)
    .join(" · ");
}

// "10 a 13 de novembro de 2026" / "30 de outubro a 2 de novembro de 2026".
function periodoEvento(edicao) {
  if (!edicao.dataInicio) return null;
  const inicio = new Date(edicao.dataInicio);
  const fim = edicao.dataFim ? new Date(edicao.dataFim) : inicio;
  const formatar = (data, opcoes) => new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", ...opcoes }).format(data);
  const mesmoAno = inicio.getUTCFullYear() === fim.getUTCFullYear();
  if (mesmoAno && inicio.getUTCMonth() === fim.getUTCMonth()) {
    const dias =
      inicio.getUTCDate() === fim.getUTCDate() ? `${inicio.getUTCDate()}` : `${inicio.getUTCDate()} a ${fim.getUTCDate()}`;
    return `${dias} de ${formatar(inicio, { month: "long" })} de ${inicio.getUTCFullYear()}`;
  }
  const opcoesInicio = mesmoAno ? { day: "numeric", month: "long" } : { day: "numeric", month: "long", year: "numeric" };
  return `${formatar(inicio, opcoesInicio)} a ${formatar(fim, { day: "numeric", month: "long", year: "numeric" })}`;
}

function localEvento(edicao) {
  return [edicao.cidade, edicao.estado].filter(Boolean).join(" – ");
}

module.exports = { linhaIdentificadores, periodoEvento, localEvento };
