// Pré-visualização dos e-mails de resultado no admin — espelha renderizar()
// de backend/src/services/emailResultado.service.js (mudou um, muda o outro).

// Mesmos dados de exemplo do "Enviar teste para mim".
export const EXEMPLO_EMAIL_RESULTADO = {
  nome: "Maria da Silva",
  titulo: "Título de exemplo do trabalho",
  modalidade: "Modalidade de exemplo",
  area: "Área de exemplo",
  edicao: "Edição de exemplo",
  observacao: "Observação de exemplo escrita pela organização para este trabalho.",
  prazo: "31/12/2026",
  link: "https://exemplo/participante/submissoes",
};

function escapar(texto) {
  return String(texto).replace(
    /[&<>"']/g,
    (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[caractere]
  );
}

export function preencherModeloResultado(texto, valores, { html }) {
  const preenchido = texto.replace(/\{\{\s*(\w+)\s*\}\}/g, (original, chave) => {
    if (!(chave in valores)) return original;
    const valor = valores[chave] ?? "";
    return html ? escapar(valor).replace(/\n/g, "<br />") : String(valor);
  });
  // Parágrafo que ficou vazio (ex.: {{observacao}} sem observação) some.
  return html ? preenchido.replace(/<p>\s*<\/p>/g, "") : preenchido;
}
