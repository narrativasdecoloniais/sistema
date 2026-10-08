// Marcadores do aviso de apresentação — espelho de
// backend/src/services/emailApresentacao.service.js (mudou um, muda o outro).
// Aqui só alimenta a pré-visualização e a validação inline; o envio de
// verdade troca no backend.
export const MARCADORES_EMAIL_APRESENTACAO = [
  { chave: "nome", descricao: "nome completo do autor" },
  { chave: "primeiroNome", descricao: "primeiro nome" },
  { chave: "email", descricao: "e-mail do destinatário" },
  { chave: "titulo", descricao: "título do trabalho" },
  { chave: "atividade", descricao: "nome da atividade" },
  { chave: "dataHorario", descricao: "dia e horário da atividade" },
  { chave: "local", descricao: "local da atividade" },
  { chave: "edicao", descricao: "nome da edição" },
  { chave: "linkAtividade", descricao: "link da página da atividade" },
  { chave: "linkSubmissoes", descricao: "link para Minhas submissões" },
];

const CHAVES = MARCADORES_EMAIL_APRESENTACAO.map((marcador) => marcador.chave);
const PADRAO_MARCADOR = /\{\{\s*(\w+)\s*\}\}/g;

export function marcadoresDesconhecidos(texto) {
  const encontrados = [...String(texto || "").matchAll(PADRAO_MARCADOR)].map((resultado) => resultado[1]);
  return [...new Set(encontrados.filter((chave) => !CHAVES.includes(chave)))];
}

// Mesmos dados do "Enviar teste para mim".
export function valoresExemploApresentacao(edicaoNome) {
  const site = typeof window !== "undefined" ? window.location.origin : "";
  return {
    nome: "Maria da Silva",
    primeiroNome: "Maria",
    email: "maria@exemplo.com",
    titulo: "Título de exemplo do trabalho",
    atividade: "Atividade de exemplo",
    dataHorario: "quinta-feira, 03/12, das 14h às 18h",
    local: "Auditório de exemplo",
    edicao: edicaoNome || "Edição de exemplo",
    linkAtividade: `${site}/atividades/atividade-de-exemplo`,
    linkSubmissoes: `${site}/participante/submissoes`,
  };
}

function escapar(texto) {
  return String(texto).replace(
    /[&<>"']/g,
    (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[caractere]
  );
}

export function preencherEmailApresentacao(texto, valores, { html }) {
  const preenchido = String(texto || "").replace(PADRAO_MARCADOR, (original, chave) => {
    if (!CHAVES.includes(chave)) return original;
    const valor = String(valores[chave] ?? "");
    return html ? escapar(valor) : valor;
  });
  return html
    ? preenchido.replace(/<p>(\s|<br\s*\/?>)*<\/p>/g, "")
    : preenchido.replace(/\s{2,}/g, " ").trim();
}
