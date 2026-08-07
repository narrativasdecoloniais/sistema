const ALGARISMOS = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function paraNumeroRomano(numero) {
  if (!Number.isInteger(numero) || numero <= 0) return String(numero ?? "");

  let restante = numero;
  let resultado = "";
  for (const [valor, simbolo] of ALGARISMOS) {
    while (restante >= valor) {
      resultado += simbolo;
      restante -= valor;
    }
  }
  return resultado;
}
