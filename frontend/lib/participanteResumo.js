import { apiClient } from "@/lib/apiClient";

// Situação do participante em cada recurso, para a tela "Início"
// (backend/src/services/participanteResumo.service.js).
export function buscarResumoParticipante() {
  return apiClient.get("/participante/resumo");
}
