// Trechos condicionais dos e-mails de resultado (emailResultado.service.js):
// {{#comCpf}}…{{/comCpf}} só aparece para quem tem CPF/documento na conta e
// {{#semCpf}}…{{/semCpf}} para quem não tem (conta importada do Even3 ou
// coautor sem conta). Espelhado em frontend/lib/emailResultado.js — mudou um,
// muda o outro.
const BLOCOS = ["comCpf", "semCpf"];

const PADRAO_ABERTURA_FECHAMENTO = /\{\{\s*([#/])\s*(\w+)\s*\}\}/g;

// Mensagem de erro em português ou null. Cada bloco precisa fechar, sem
// aninhar outro dentro, e só com nomes conhecidos.
function validarBlocos(texto) {
  let aberto = null;
  for (const [, tipo, nome] of String(texto || "").matchAll(PADRAO_ABERTURA_FECHAMENTO)) {
    if (!BLOCOS.includes(nome)) return `Trecho condicional desconhecido: {{${tipo}${nome}}}.`;
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

// condicoes: { comCpf: boolean, semCpf: boolean }. Mantém o conteúdo dos
// blocos verdadeiros (tirando só os marcadores) e remove os demais inteiros.
function aplicarBlocos(texto, condicoes) {
  return BLOCOS.reduce((resultado, nome) => {
    const padrao = new RegExp(`\\{\\{\\s*#${nome}\\s*\\}\\}([\\s\\S]*?)\\{\\{\\s*/${nome}\\s*\\}\\}`, "g");
    return resultado.replace(padrao, (_original, conteudo) => (condicoes[nome] ? conteudo : ""));
  }, String(texto || ""));
}

// Parágrafo, item ou lista que ficou vazio depois dos blocos/marcadores some.
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

module.exports = { BLOCOS, validarBlocos, aplicarBlocos, limparVazios };
