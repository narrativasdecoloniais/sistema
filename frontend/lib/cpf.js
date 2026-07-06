export function apenasDigitos(valor) {
  return String(valor || "").replace(/\D/g, "");
}

export function formatarCpf(valor) {
  const digitos = apenasDigitos(valor).slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function calcularDigitoVerificador(digitos, pesoInicial) {
  const soma = digitos
    .split("")
    .reduce((acc, digito, indice) => acc + Number(digito) * (pesoInicial - indice), 0);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

export function cpfValido(cpfBruto) {
  const cpf = apenasDigitos(cpfBruto);

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const primeiroDigito = calcularDigitoVerificador(cpf.slice(0, 9), 10);
  if (primeiroDigito !== Number(cpf[9])) return false;

  const segundoDigito = calcularDigitoVerificador(cpf.slice(0, 10), 11);
  if (segundoDigito !== Number(cpf[10])) return false;

  return true;
}
