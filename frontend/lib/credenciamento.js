import { apiClient } from "@/lib/apiClient";
import { formatarPeriodoAtividade } from "@/lib/publico";

// Mesmo formato de backend/src/services/credenciamento.service.js (REGEX_TOKEN).
const REGEX_TOKEN = /^[ea]_[A-Za-z0-9_-]{20,64}$/;

// O QR code guarda a URL .../participante/credenciamento/<token> (assim a
// câmera nativa do celular também funciona). Aceita a URL de qualquer
// ambiente (produção/local) e também o token puro.
export function extrairTokenDoQr(texto) {
  const valor = String(texto || "").trim();
  if (REGEX_TOKEN.test(valor)) return valor;
  try {
    const partes = new URL(valor).pathname.split("/").filter(Boolean);
    const indice = partes.indexOf("credenciamento");
    const token = indice >= 0 ? partes[indice + 1] : null;
    return token && REGEX_TOKEN.test(token) ? token : null;
  } catch {
    return null;
  }
}

// Área do participante
export function buscarMinhaSituacaoCredenciamento() {
  return apiClient.get("/participante/credenciamento");
}

export function buscarPreviaCredenciamento(token) {
  return apiClient.get(`/participante/credenciamento/${encodeURIComponent(token)}`);
}

export function credenciarNoEvento(token) {
  return apiClient.post(`/participante/credenciamento/${encodeURIComponent(token)}/evento`, {});
}

export function registrarPresencaNaAtividade(token, opcoes = {}) {
  return apiClient.post(`/participante/credenciamento/${encodeURIComponent(token)}/atividade`, opcoes);
}

// Admin (seção CREDENCIAMENTO)
const base = (edicaoId) => `/edicoes/${edicaoId}/credenciamento`;

export const credenciamentoAdmin = {
  listar: (edicaoId) => apiClient.get(base(edicaoId)),
  qrEvento: (edicaoId) => apiClient.get(`${base(edicaoId)}/qr`),
  novoQrEvento: (edicaoId) => apiClient.post(`${base(edicaoId)}/qr/novo`, {}),
  credenciar: (edicaoId, usuarioId) => apiClient.post(`${base(edicaoId)}/usuarios/${usuarioId}`, {}),
  desfazer: (edicaoId, usuarioId) => apiClient.delete(`${base(edicaoId)}/usuarios/${usuarioId}`),
  listarAtividades: (edicaoId) => apiClient.get(`${base(edicaoId)}/atividades`),
  qrTodasAtividades: (edicaoId) => apiClient.get(`${base(edicaoId)}/atividades/qr`),
  listarPresencas: (edicaoId, atividadeId) => apiClient.get(`${base(edicaoId)}/atividades/${atividadeId}`),
  qrAtividade: (edicaoId, atividadeId) => apiClient.get(`${base(edicaoId)}/atividades/${atividadeId}/qr`),
  novoQrAtividade: (edicaoId, atividadeId) => apiClient.post(`${base(edicaoId)}/atividades/${atividadeId}/qr/novo`, {}),
  registrarPresenca: (edicaoId, atividadeId, usuarioId) =>
    apiClient.post(`${base(edicaoId)}/atividades/${atividadeId}/presencas/${usuarioId}`, {}),
  removerPresenca: (edicaoId, atividadeId, usuarioId) =>
    apiClient.delete(`${base(edicaoId)}/atividades/${atividadeId}/presencas/${usuarioId}`),
};

// QR code como imagem PNG (data URI). A lib entra sob demanda — só o admin usa.
export async function gerarQrDataUrl(texto, tamanho = 720) {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(texto, { width: tamanho, margin: 2, errorCorrectionLevel: "M" });
}

export async function baixarQrPng(qr, nomeArquivo) {
  const link = document.createElement("a");
  link.href = await gerarQrDataUrl(qr.url);
  link.download = `${nomeArquivo}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function escaparHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (caractere) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[caractere]
  );
}

// Cartazes A4 (um QR por página) numa janela própria, no molde do
// comprovante de inscrição (CartaoInscricaoParticipante.jsx). A janela abre
// já no clique (senão o navegador bloqueia como pop-up) e é preenchida
// depois que os QR são gerados. `obterQrs` é a lista ou uma função async que
// a busca na API (chamada só depois de a janela estar aberta).
export async function imprimirQrCodes(obterQrs, { evento }) {
  const janela = window.open("", "_blank", "width=820,height=1000");
  if (!janela) throw new Error("O navegador bloqueou a janela de impressão. Libere pop-ups para este site.");
  janela.document.write("<p style=\"font-family:sans-serif;padding:2rem\">Gerando QR codes...</p>");

  let qrs;
  try {
    qrs = typeof obterQrs === "function" ? await obterQrs() : obterQrs;
  } catch (erro) {
    janela.close();
    throw erro;
  }

  const paginas = [];
  for (const qr of qrs) {
    const imagem = await gerarQrDataUrl(qr.url, 900);
    const detalhe = qr.atividade
      ? [formatarPeriodoAtividade(qr.atividade.inicioAtividade, qr.atividade.fimAtividade), qr.atividade.local]
          .filter(Boolean)
          .join(" · ")
      : "";
    paginas.push(`
      <section class="pagina">
        <p class="evento">${escaparHtml(evento)}</p>
        <p class="tipo">${escaparHtml(qr.subtitulo)}</p>
        <h1>${escaparHtml(qr.titulo)}</h1>
        ${detalhe ? `<p class="detalhe">${escaparHtml(detalhe)}</p>` : ""}
        <img src="${imagem}" alt="QR code" />
        <p class="instrucao">Aponte a câmera do celular para o QR code<br />ou entre na sua conta e vá em <strong>Credenciamento</strong>.</p>
      </section>`);
  }

  janela.document.open();
  janela.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>QR codes — ${escaparHtml(evento)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #201914; }
  .pagina {
    min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 1cm; page-break-after: always; break-after: page;
  }
  .pagina:last-child { page-break-after: auto; break-after: auto; }
  .evento { margin: 0; font-size: 14pt; color: #4D4842; }
  .tipo { margin: 0.6cm 0 0; font-size: 13pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9c4a2f; }
  h1 { margin: 0.2cm 0 0; font-size: 26pt; line-height: 1.2; }
  .detalhe { margin: 0.3cm 0 0; font-size: 13pt; color: #4D4842; }
  img { width: 12cm; height: 12cm; margin: 0.8cm 0; }
  .instrucao { margin: 0; font-size: 14pt; line-height: 1.5; }
  @page { size: A4; margin: 1cm; }
</style>
</head>
<body>${paginas.join("")}</body>
</html>`);
  janela.document.close();
  janela.focus();
  janela.onafterprint = () => janela.close();
  setTimeout(() => janela.print(), 400);
}
