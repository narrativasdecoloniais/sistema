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

// Liberados com a divulgação do resultado da edição, sem o botão Liberar —
// a carta de aceite, que tem tela própria (Submissões › Carta de aceite).
export const TIPOS_LIBERADOS_COM_RESULTADO = ["CARTA_ACEITE"];

// Página de cada tipo em mm — mesma base do gerador de PDF
// (backend/src/utils/paginaCertificado.js, mudou um, muda o outro): A4
// paisagem, retrato na carta de aceite. fundoRecomendado/fundoMinimo são a
// orientação de tamanho da imagem de fundo (300 e 150 dpi).
const PAISAGEM = {
  largura: 297,
  altura: 210,
  retrato: false,
  fundoRecomendado: { largura: 3508, altura: 2480 },
  fundoMinimo: { largura: 1754, altura: 1240 },
};
const RETRATO = {
  largura: 210,
  altura: 297,
  retrato: true,
  fundoRecomendado: { largura: 2480, altura: 3508 },
  fundoMinimo: { largura: 1240, altura: 1754 },
};

export function paginaCertificado(tipo) {
  return tipo === "CARTA_ACEITE" ? RETRATO : PAISAGEM;
}

// Avisos (não bloqueantes) sobre a imagem de fundo escolhida.
export function avisosFundo(dimensoes, pagina) {
  if (!dimensoes?.largura || !dimensoes?.altura) return [];
  const avisos = [];
  const orientacao = pagina.retrato ? "retrato" : "paisagem";
  const proporcaoA4 = pagina.largura / pagina.altura;
  const proporcao = dimensoes.largura / dimensoes.altura;
  if (Math.abs(proporcao - proporcaoA4) / proporcaoA4 > 0.02) {
    const outraOrientacao = pagina.retrato ? dimensoes.largura > dimensoes.altura : dimensoes.altura > dimensoes.largura;
    avisos.push(
      outraOrientacao
        ? `A imagem está em ${pagina.retrato ? "paisagem" : "retrato"}. Este documento é A4 ${orientacao}, então as bordas ${pagina.retrato ? "laterais" : "de cima e de baixo"} serão cortadas.`
        : `A proporção da imagem é diferente do A4 ${orientacao} (${pagina.largura} × ${pagina.altura}). Ela vai preencher a página, mas as bordas serão cortadas.`
    );
  }
  const { fundoMinimo } = pagina;
  if (dimensoes.largura < fundoMinimo.largura || dimensoes.altura < fundoMinimo.altura) {
    avisos.push(
      `A resolução está abaixo do mínimo (${fundoMinimo.largura} × ${fundoMinimo.altura} px) e pode sair pixelada na impressão.`
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

// Tela Submissões › Carta de aceite (backend: cartasAceite.controller.js).
// salvarModelo/previa com a mesma assinatura de certificadosAdmin, pro
// ModeloCertificadoForm.
const baseCartas = (edicaoId) => `/edicoes/${edicaoId}/cartas-aceite`;
export const cartasAceiteAdmin = {
  listar: (edicaoId) => apiClient.get(baseCartas(edicaoId)),
  salvarModelo: (edicaoId, _tipo, modelo) => apiClient.put(`${baseCartas(edicaoId)}/modelo`, modelo),
  previa: (edicaoId, _tipo, modelo) =>
    apiClient.blob(`${baseCartas(edicaoId)}/modelo/previa`, { method: "POST", body: modelo }),
  gerar: (edicaoId) => apiClient.post(`${baseCartas(edicaoId)}/gerar`),
  // { ids? , reenviar }
  enviarPorEmail: (edicaoId, dados) => apiClient.post(`${baseCartas(edicaoId)}/envio-email`, dados),
  retomarEnvioEmail: (edicaoId) => apiClient.post(`${baseCartas(edicaoId)}/envio-email/retomar`),
  revogar: (edicaoId, id) => apiClient.post(`${baseCartas(edicaoId)}/${id}/revogar`, {}),
  restaurar: (edicaoId, id) => apiClient.post(`${baseCartas(edicaoId)}/${id}/restaurar`),
  revogarEmLote: (edicaoId, ids) => apiClient.post(`${baseCartas(edicaoId)}/revogacao-em-lote`, { ids }),
  async baixar(edicaoId, carta) {
    const blob = await apiClient.blob(`${baseCartas(edicaoId)}/${carta.id}/pdf`);
    salvarBlob(blob, `carta-de-aceite-${carta.codigo}.pdf`);
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
