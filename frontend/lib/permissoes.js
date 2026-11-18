// Funções puras (sem next/headers), pra poder ser importado tanto de Server
// Components quanto de Client Components (ex.: NavegacaoEdicao.jsx).
export function temPapel(usuario, ...papeis) {
  return Boolean(usuario?.papeis?.some((papel) => papeis.includes(papel)));
}

// Seções liberadas ao usuário como monitor selecionado, por edição:
// { [edicaoId]: secoes[] } (vem de /usuarios/me; vazio para a equipe).
export function secoesDeMonitor(usuario, edicaoId) {
  const acesso = usuario?.acessoMonitor || {};
  if (edicaoId) return acesso[edicaoId] || [];
  return Object.values(acesso).flat();
}

export function temAcessoAoPainel(usuario) {
  return temPapel(usuario, "ADMIN", "ORGANIZADOR") || Object.keys(usuario?.acessoMonitor || {}).length > 0;
}

// Sem edicaoId vale "alguma edição" — o menu/telas só escondem; quem barra de
// verdade é o backend (por edição) e o layout de /admin/edicoes/[id].
export function temPermissaoSecao(usuario, ...secoes) {
  if (temPapel(usuario, "ADMIN")) return true;
  if (!temPapel(usuario, "ORGANIZADOR")) {
    const doMonitor = secoesDeMonitor(usuario);
    return secoes.some((secao) => doMonitor.includes(secao));
  }
  return Boolean(usuario?.acessoCompleto) || secoes.some((secao) => usuario?.secoesPermitidas?.includes(secao));
}
