// AND-gate: inscricoesEncerradasManualmente só fecha, nunca abre fora da
// janela. Sem inicioInscricoes/fimInscricoes preenchidos, fica fechado por
// padrão. Mesmo padrão de módulo pequeno e puro de haSobreposicao/
// prazoSubmissaoAberto — espelhado em frontend, se necessário, sem depender
// deste arquivo (o backend é a autoridade real).
function inscricoesAbertas(edicao) {
  if (edicao.inscricoesEncerradasManualmente) return false;
  if (!edicao.inicioInscricoes || !edicao.fimInscricoes) return false;
  const agora = new Date();
  return agora >= new Date(edicao.inicioInscricoes) && agora <= new Date(edicao.fimInscricoes);
}

module.exports = inscricoesAbertas;
