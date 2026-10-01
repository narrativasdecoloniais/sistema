const escaparHtml = require("./escaparHtml");

// Marcadores dos e-mails em massa (emailsMassa.service.js). Espelhado em
// frontend/lib/emailsMassa.js — mudou um, muda o outro. No corpo os valores
// entram com escape de HTML; no assunto (texto puro), crus.
const MARCADORES = ["nome", "primeiroNome", "email", "edicao", "linkParticipante", "linkSite"];

const PADRAO_MARCADOR = /\{\{\s*(\w+)\s*\}\}/g;

function marcadoresDesconhecidos(texto) {
  const encontrados = [...String(texto).matchAll(PADRAO_MARCADOR)].map((resultado) => resultado[1]);
  return [...new Set(encontrados.filter((chave) => !MARCADORES.includes(chave)))];
}

function substituir(texto, valores, { html }) {
  return String(texto).replace(PADRAO_MARCADOR, (original, chave) => {
    if (!MARCADORES.includes(chave)) return original;
    const valor = String(valores[chave] ?? "");
    return html ? escaparHtml(valor) : valor;
  });
}

// pessoa: { nome, email }; contexto: { edicao, linkParticipante, linkSite }
function valoresPara(pessoa, contexto) {
  const nome = String(pessoa.nome || "").trim();
  return {
    nome,
    primeiroNome: nome.split(/\s+/)[0] || "",
    email: pessoa.email || "",
    ...contexto,
  };
}

module.exports = { MARCADORES, marcadoresDesconhecidos, substituir, valoresPara };
