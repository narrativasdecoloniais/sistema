// Funções puras (sem next/headers), pra poder ser importado tanto de Server
// Components quanto de Client Components (ex.: NavegacaoEdicao.jsx).
export function temPapel(usuario, ...papeis) {
  return Boolean(usuario?.papeis?.some((papel) => papeis.includes(papel)));
}

export function temPermissaoSecao(usuario, ...secoes) {
  if (temPapel(usuario, "ADMIN")) return true;
  if (!temPapel(usuario, "ORGANIZADOR")) return false;
  return Boolean(usuario?.acessoCompleto) || secoes.some((secao) => usuario?.secoesPermitidas?.includes(secao));
}
