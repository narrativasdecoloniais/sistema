// Pré-visualização dos e-mails de resultado no admin — espelha renderizar()
// de backend/src/services/emailResultado.service.js (mudou um, muda o outro).

// Mesmos dados de exemplo do "Enviar teste para mim".
export const EXEMPLO_EMAIL_RESULTADO = {
  nome: "Maria da Silva",
  email: "maria@exemplo.com",
  titulo: "Título de exemplo do trabalho",
  modalidade: "Modalidade de exemplo",
  area: "Área de exemplo",
  edicao: "Edição de exemplo",
  observacao: "Observação de exemplo escrita pela organização para este trabalho.",
  prazo: "31/12/2026",
  link: "https://exemplo/participante/submissoes",
  comCpf: true,
};

// Trechos condicionais — espelha backend/src/utils/blocosCondicionaisEmail.js.
// {{#comCpf}}…{{/comCpf}} só para quem tem CPF/documento na conta;
// {{#semCpf}}…{{/semCpf}} para quem não tem (ou não tem conta).
export const BLOCOS_EMAIL_RESULTADO = ["comCpf", "semCpf"];

const PADRAO_ABERTURA_FECHAMENTO = /\{\{\s*([#/])\s*(\w+)\s*\}\}/g;

export function validarBlocos(texto) {
  let aberto = null;
  for (const [, tipo, nome] of String(texto || "").matchAll(PADRAO_ABERTURA_FECHAMENTO)) {
    if (!BLOCOS_EMAIL_RESULTADO.includes(nome)) return `Trecho condicional desconhecido: {{${tipo}${nome}}}.`;
    if (tipo === "#") {
      if (aberto) return `O trecho {{#${aberto}}} precisa ser fechado com {{/${aberto}}} antes de abrir {{#${nome}}}.`;
      aberto = nome;
    } else {
      if (aberto !== nome) return `{{/${nome}}} fecha um trecho que não foi aberto com {{#${nome}}}.`;
      aberto = null;
    }
  }
  return aberto ? `O trecho {{#${aberto}}} não foi fechado com {{/${aberto}}}.` : null;
}

function aplicarBlocos(texto, condicoes) {
  return BLOCOS_EMAIL_RESULTADO.reduce((resultado, nome) => {
    const padrao = new RegExp(`\\{\\{\\s*#${nome}\\s*\\}\\}([\\s\\S]*?)\\{\\{\\s*/${nome}\\s*\\}\\}`, "g");
    return resultado.replace(padrao, (_original, conteudo) => (condicoes[nome] ? conteudo : ""));
  }, String(texto || ""));
}

function limparVazios(html) {
  let anterior;
  let atual = html;
  do {
    anterior = atual;
    atual = atual
      .replace(/<p>(\s|<br\s*\/?>)*<\/p>/g, "")
      .replace(/<li>\s*<\/li>/g, "")
      .replace(/<(ul|ol)>\s*<\/\1>/g, "");
  } while (atual !== anterior);
  return atual;
}

function escapar(texto) {
  return String(texto).replace(
    /[&<>"']/g,
    (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[caractere]
  );
}

export function preencherModeloResultado(texto, valores, { html }) {
  const condicoes = { comCpf: Boolean(valores.comCpf), semCpf: !valores.comCpf };
  const preenchido = aplicarBlocos(texto, condicoes).replace(/\{\{\s*(\w+)\s*\}\}/g, (original, chave) => {
    if (!(chave in valores) || chave === "comCpf") return original;
    const valor = valores[chave] ?? "";
    return html ? escapar(valor).replace(/\n/g, "<br />") : String(valor);
  });
  // O que ficou vazio (ex.: {{observacao}} sem observação, bloco removido) some.
  return html ? limparVazios(preenchido) : preenchido.replace(/\s{2,}/g, " ").trim();
}
