// Caminho pra onde voltar depois do login (?destino=). Só aceita caminho
// interno do próprio site — "/algo", nunca "//outro-site" ou "/\outro-site",
// que o navegador trata como outro domínio (open redirect).
export function destinoSeguro(valor) {
  if (typeof valor !== "string" || !valor.startsWith("/")) return null;
  if (valor.startsWith("//") || valor.startsWith("/\\")) return null;
  return valor;
}

export function ehDestinoInscricao(destino) {
  return Boolean(destino?.startsWith("/participante/inscricoes"));
}
