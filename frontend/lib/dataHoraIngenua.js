// O sistema trata data/hora de atividades e edições como "ingênuas": o valor
// digitado (ex.: 15:00) é gravado literalmente como `...T15:00:00.000Z`, sem
// nenhuma conversão real de fuso horário — o `Z` é decorativo. Ler/escrever
// sempre via componentes UTC (toISOString) mantém essa convenção simétrica
// entre o que o usuário digita e o que aparece de volta na tela.

export function paraData(valor) {
  if (!valor) return "";
  return new Date(valor).toISOString().slice(0, 10);
}

export function paraHora(valor) {
  if (!valor) return "";
  return new Date(valor).toISOString().slice(11, 16);
}

export function combinar(valorAtual, { data, hora }) {
  const novaData = data ?? paraData(valorAtual);
  const novaHora = hora ?? paraHora(valorAtual);
  if (!novaData) return "";
  return `${novaData}T${novaHora || "00:00"}:00.000Z`;
}
