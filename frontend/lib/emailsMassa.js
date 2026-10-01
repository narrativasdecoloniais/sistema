// Marcadores dos e-mails em massa — espelho de
// backend/src/utils/marcadoresEmailMassa.js (mudou um, muda o outro). Aqui só
// alimenta a pré-visualização; o envio de verdade troca no backend.
export const MARCADORES_EMAIL = [
  { chave: "nome", descricao: "nome completo" },
  { chave: "primeiroNome", descricao: "primeiro nome" },
  { chave: "email", descricao: "e-mail da pessoa" },
  { chave: "edicao", descricao: "nome da edição" },
  { chave: "linkParticipante", descricao: "link da área do participante" },
  { chave: "linkSite", descricao: "link do site" },
];

const CHAVES = MARCADORES_EMAIL.map((marcador) => marcador.chave);

function escapar(texto) {
  return String(texto).replace(
    /[&<>"']/g,
    (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[caractere]
  );
}

export function valoresExemplo(pessoa, edicaoNome) {
  const nome = String(pessoa?.nome || "Maria da Silva").trim();
  const site = typeof window !== "undefined" ? window.location.origin : "";
  return {
    nome,
    primeiroNome: nome.split(/\s+/)[0] || "",
    email: pessoa?.email || "maria@exemplo.com",
    edicao: edicaoNome || "Narrativas",
    linkParticipante: `${site}/participante`,
    linkSite: site,
  };
}

export function preencherMarcadores(texto, valores, { html }) {
  return String(texto || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (original, chave) => {
    if (!CHAVES.includes(chave)) return original;
    const valor = String(valores[chave] ?? "");
    return html ? escapar(valor) : valor;
  });
}

export function formatarDataHora(valor) {
  if (!valor) return "";
  return new Date(valor).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
