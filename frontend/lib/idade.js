// Idade completa em `referencia` (datas "ingênuas": só componentes UTC) —
// mesma conta de idadeEm em backend/src/validators/monitoria.validators.js.
export function idadeEm(dataNascimentoIso, referencia) {
  const nascimento = new Date(dataNascimentoIso);
  const ref = new Date(referencia);
  let idade = ref.getUTCFullYear() - nascimento.getUTCFullYear();
  const aniversarioAindaNaoChegou =
    ref.getUTCMonth() < nascimento.getUTCMonth() ||
    (ref.getUTCMonth() === nascimento.getUTCMonth() && ref.getUTCDate() < nascimento.getUTCDate());
  if (aniversarioAindaNaoChegou) idade -= 1;
  return idade;
}
