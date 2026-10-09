import { apiClient, salvarBlob } from "./apiClient";

// Certificados (backend/src/services/certificados.service.js): admin da
// edição, área do participante e validação pública.

export const ROTULOS_TIPO_CERTIFICADO = {
  PARTICIPACAO_EVENTO: "Participação no evento",
  PRESENCA_ATIVIDADE: "Presença em atividade",
  APRESENTACAO_TRABALHO: "Apresentação de trabalho",
  AVALIADOR: "Avaliação de trabalhos",
  MONITOR: "Monitoria",
  ATUACAO_ATIVIDADE: "Atuação em atividade",
  EQUIPE_EVENTO: "Equipe do evento",
};

// Página A4 paisagem em mm — mesma base do gerador de PDF.
export const PAGINA_CERTIFICADO = { largura: 297, altura: 210 };

// Orientação de tamanho da imagem de fundo (A4 paisagem).
export const FUNDO_RECOMENDADO = { largura: 3508, altura: 2480 };
export const FUNDO_MINIMO = { largura: 1754, altura: 1240 };
const PROPORCAO_A4 = PAGINA_CERTIFICADO.largura / PAGINA_CERTIFICADO.altura;

// Avisos (não bloqueantes) sobre a imagem de fundo escolhida.
export function avisosFundo(dimensoes) {
  if (!dimensoes?.largura || !dimensoes?.altura) return [];
  const avisos = [];
  const proporcao = dimensoes.largura / dimensoes.altura;
  if (Math.abs(proporcao - PROPORCAO_A4) / PROPORCAO_A4 > 0.02) {
    avisos.push(
      dimensoes.altura > dimensoes.largura
        ? "A imagem está em retrato. O certificado é A4 paisagem, então as bordas de cima e de baixo serão cortadas."
        : "A proporção da imagem é diferente do A4 paisagem (297 × 210). Ela vai preencher a página, mas as bordas serão cortadas."
    );
  }
  if (dimensoes.largura < FUNDO_MINIMO.largura || dimensoes.altura < FUNDO_MINIMO.altura) {
    avisos.push(
      `A resolução está abaixo do mínimo (${FUNDO_MINIMO.largura} × ${FUNDO_MINIMO.altura} px) e pode sair pixelada na impressão.`
    );
  }
  return avisos;
}

const base = (edicaoId) => `/edicoes/${edicaoId}/certificados`;

export const certificadosAdmin = {
  listar: (edicaoId) => apiClient.get(base(edicaoId)),
  salvarModelo: (edicaoId, tipo, modelo) => apiClient.put(`${base(edicaoId)}/modelos/${tipo}`, modelo),
  previa: (edicaoId, tipo, modelo) =>
    apiClient.blob(`${base(edicaoId)}/modelos/${tipo}/previa`, { method: "POST", body: modelo }),
  gerar: (edicaoId, tipo) => apiClient.post(`${base(edicaoId)}/modelos/${tipo}/gerar`),
  definirLiberacao: (edicaoId, tipo, liberado) =>
    apiClient.patch(`${base(edicaoId)}/modelos/${tipo}/liberacao`, { liberado }),
  incluirManual: (edicaoId, dados) => apiClient.post(`${base(edicaoId)}/manual`, dados),
  revogar: (edicaoId, id, motivo) => apiClient.post(`${base(edicaoId)}/${id}/revogar`, { motivo }),
  restaurar: (edicaoId, id) => apiClient.post(`${base(edicaoId)}/${id}/restaurar`),
  revogarEmLote: (edicaoId, ids, motivo) => apiClient.post(`${base(edicaoId)}/revogacao-em-lote`, { ids, motivo }),
  // { tipos } ou { ids }, + reenviar (inclui quem já recebeu).
  enviarPorEmail: (edicaoId, dados) => apiClient.post(`${base(edicaoId)}/envio-email`, dados),
  retomarEnvioEmail: (edicaoId) => apiClient.post(`${base(edicaoId)}/envio-email/retomar`),
  salvarMembroEquipe: (edicaoId, id, dados) =>
    id ? apiClient.put(`${base(edicaoId)}/equipe/${id}`, dados) : apiClient.post(`${base(edicaoId)}/equipe`, dados),
  excluirMembroEquipe: (edicaoId, id) => apiClient.delete(`${base(edicaoId)}/equipe/${id}`),
  atualizarConvidado: (edicaoId, id, dados) => apiClient.patch(`${base(edicaoId)}/convidados/${id}`, dados),
  async baixar(edicaoId, certificado) {
    const blob = await apiClient.blob(`${base(edicaoId)}/${certificado.id}/pdf`);
    salvarBlob(blob, `certificado-${certificado.codigo}.pdf`);
  },
};

export const certificadosParticipante = {
  listar: () => apiClient.get("/participante/certificados"),
  async baixar(certificado) {
    const blob = await apiClient.blob(`/participante/certificados/${certificado.id}/pdf`);
    salvarBlob(blob, `certificado-${certificado.codigo}.pdf`);
  },
};

// Download direto do PDF pelo código (validação pública e link do e-mail).
export function urlPdfCertificadoPublico(codigo) {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return `${api}/publico/certificados/${encodeURIComponent(codigo)}/pdf`;
}

// "abcd efgh-jkmn" -> "ABCD-EFGH-JKMN" (o backend aceita com ou sem hífen).
export function normalizarCodigoCertificado(entrada) {
  const limpo = String(entrada || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return limpo.match(/.{1,4}/g)?.join("-") || "";
}
