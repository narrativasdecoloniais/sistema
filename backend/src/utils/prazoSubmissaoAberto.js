// Datas de prazo de submissão são só dia (sem hora relevante), mesmo
// raciocínio de fuso fixo em UTC do formatarPeriodoSubmissao no frontend
// (frontend/lib/publico.js) — compara datas (não instantes) pra o dia de
// prazoFim contar inteiro como aberto. Comparar `new Date() <= prazoFim`
// direto fecharia o prazo já na meia-noite UTC do próprio dia final, em vez
// de só depois dele.
function prazoSubmissaoAberto(prazoInicio, prazoFim) {
  const hoje = new Date().toISOString().slice(0, 10);
  const inicio = new Date(prazoInicio).toISOString().slice(0, 10);
  const fim = new Date(prazoFim).toISOString().slice(0, 10);
  return hoje >= inicio && hoje <= fim;
}

module.exports = prazoSubmissaoAberto;
