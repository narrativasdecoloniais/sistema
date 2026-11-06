import { apiClient } from "@/lib/apiClient";

// Situação do participante em cada recurso, para a tela "Início" e o menu
// lateral (backend/src/services/participanteResumo.service.js). O menu e o
// Início montam juntos no primeiro carregamento: quem chamar enquanto a
// requisição está em andamento reaproveita a mesma, sem guardar cache depois —
// voltar ao Início sempre busca a situação atualizada.
let emAndamento = null;

export function buscarResumoParticipante() {
  if (!emAndamento) {
    emAndamento = apiClient.get("/participante/resumo").finally(() => {
      emAndamento = null;
    });
  }
  return emAndamento;
}
