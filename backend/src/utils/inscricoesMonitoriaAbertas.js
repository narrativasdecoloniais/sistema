// Janela de inscrição na monitoria — mesma regra de inscricoesAbertas.js:
// sem as duas datas preenchidas fica fechada (nunca abre "por acidente").
// Espelhada em frontend/lib/monitoria.js (só para exibir; o backend decide).
function inscricoesMonitoriaAbertas(edicao) {
  if (!edicao.inicioInscricoesMonitoria || !edicao.fimInscricoesMonitoria) return false;
  const agora = new Date();
  return agora >= new Date(edicao.inicioInscricoesMonitoria) && agora <= new Date(edicao.fimInscricoesMonitoria);
}

module.exports = inscricoesMonitoriaAbertas;
