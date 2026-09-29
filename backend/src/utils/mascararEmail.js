// "maria.silva@gmail.com" → "ma•••••••••@gmail.com". Usado quando a resposta
// precisa apontar qual e-mail está numa conta sem entregá-lo inteiro a quem
// só digitou um CPF.
function mascararEmail(email) {
  const [local, dominio] = String(email).split("@");
  if (!dominio) return "•••";
  const visivel = local.length > 3 ? 2 : 1;
  return `${local.slice(0, visivel)}${"•".repeat(Math.max(local.length - visivel, 3))}@${dominio}`;
}

// Versão mais aberta — metade inicial visível: "maria.silva@gmail.com" →
// "maria.•••••@gmail.com". Usada na regularização de cadastro, em que a
// pessoa precisa reconhecer qual das contas encontradas é a dela.
function mascararEmailParcial(email) {
  const [local, dominio] = String(email).split("@");
  if (!dominio) return "•••";
  const visivel = Math.max(1, Math.ceil(local.length / 2));
  return `${local.slice(0, visivel)}${"•".repeat(Math.max(local.length - visivel, 3))}@${dominio}`;
}

module.exports = mascararEmail;
module.exports.mascararEmailParcial = mascararEmailParcial;
