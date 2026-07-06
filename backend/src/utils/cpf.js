function apenasDigitos(cpf) {
  return String(cpf || "").replace(/\D/g, "");
}

function calcularDigitoVerificador(digitos, pesoInicial) {
  const soma = digitos
    .split("")
    .reduce((acc, digito, indice) => acc + Number(digito) * (pesoInicial - indice), 0);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

function cpfValido(cpfBruto) {
  const cpf = apenasDigitos(cpfBruto);

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const primeiroDigito = calcularDigitoVerificador(cpf.slice(0, 9), 10);
  if (primeiroDigito !== Number(cpf[9])) return false;

  const segundoDigito = calcularDigitoVerificador(cpf.slice(0, 10), 11);
  if (segundoDigito !== Number(cpf[10])) return false;

  return true;
}

module.exports = { cpfValido, apenasDigitos };
