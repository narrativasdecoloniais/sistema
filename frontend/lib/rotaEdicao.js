export function extrairContextoEdicao(pathname) {
  const correspondencia = /^\/admin\/edicoes\/([^/]+)/.exec(pathname);
  if (!correspondencia) return { id: null, criando: false };
  if (correspondencia[1] === "nova") return { id: null, criando: true };
  return { id: correspondencia[1], criando: false };
}
