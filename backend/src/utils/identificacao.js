const { apenasDigitos } = require("./cpf");

// Documento de estrangeiro sem validação de formato, mas comparado sempre
// normalizado: "ab 123.456-7" e "AB1234567" são o mesmo número.
function normalizarDocumento(documento) {
  return String(documento || "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

// Converte o que veio validado (tipoDocumento + cpf ou documento/pais) nos
// campos de Usuario — { cpf } ou { documentoEstrangeiro, pais }.
function identificacaoDe(dados) {
  if (dados.tipoDocumento === "ESTRANGEIRO") {
    return { documentoEstrangeiro: normalizarDocumento(dados.documento), pais: dados.pais };
  }
  return { cpf: apenasDigitos(dados.cpf) };
}

function temIdentificacao(usuario) {
  return Boolean(usuario?.cpf || usuario?.documentoEstrangeiro);
}

// "CPF" ou "documento" — para mensagens que servem aos dois casos.
function rotuloIdentificacao(identificacao) {
  return identificacao.cpf ? "CPF" : "documento";
}

module.exports = { normalizarDocumento, identificacaoDe, temIdentificacao, rotuloIdentificacao };
