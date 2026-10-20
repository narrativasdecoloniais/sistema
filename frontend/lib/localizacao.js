// Organização do guia da dobra Localização (mapa + lista), compartilhada pela
// página pública e pelo admin: categoria (tipo de ponto) → subcategoria
// (`grupo`, texto livre) → pontos.

// Tipos com `ordem` primeiro (crescente), depois os sem ordem, desempate
// pelo nome — mesma regra de listarTiposPontoInteresse no backend.
export function compararTiposPonto(a, b) {
  const ordemA = a.ordem ?? Infinity;
  const ordemB = b.ordem ?? Infinity;
  if (ordemA !== ordemB) return ordemA - ordemB;
  return a.nome.localeCompare(b.nome, "pt-BR");
}

// Agrupa os pontos (já na ordem do admin) por tipo e, dentro dele, por
// subcategoria na ordem em que cada uma aparece pela primeira vez. Pontos
// sem subcategoria ficam num grupo sem nome, também na posição do primeiro.
export function organizarGuia(pontos) {
  const categorias = new Map();

  for (const ponto of pontos) {
    if (!categorias.has(ponto.tipo.id)) {
      categorias.set(ponto.tipo.id, { tipo: ponto.tipo, total: 0, grupos: new Map() });
    }
    const categoria = categorias.get(ponto.tipo.id);
    const chaveGrupo = ponto.grupo?.trim() || "";
    if (!categoria.grupos.has(chaveGrupo)) {
      categoria.grupos.set(chaveGrupo, { nome: chaveGrupo, pontos: [] });
    }
    categoria.grupos.get(chaveGrupo).pontos.push(ponto);
    categoria.total += 1;
  }

  return [...categorias.values()]
    .sort((a, b) => compararTiposPonto(a.tipo, b.tipo))
    .map((categoria) => ({ ...categoria, grupos: [...categoria.grupos.values()] }));
}

// Rótulo do link do estabelecimento a partir do domínio — o gestor só cola a
// URL, e a lista mostra "Instagram", "Booking" etc. em vez de um "Link" genérico.
const ROTULOS_DOMINIO = [
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)booking\.com$/, "Booking"],
  [/(^|\.)airbnb\.com(\.br)?$/, "Airbnb"],
  [/(^|\.)facebook\.com$/, "Facebook"],
  [/(^|\.)(wa\.me|whatsapp\.com)$/, "WhatsApp"],
  [/(^|\.)(maps\.app\.goo\.gl|goo\.gl)$/, "Google Maps"],
];

export function rotuloLinkPonto(url) {
  try {
    const { hostname, pathname } = new URL(url);
    const dominio = hostname.replace(/^www\./, "");
    if (/(^|\.)google\.[a-z.]+$/.test(dominio) && pathname.startsWith("/maps")) return "Google Maps";
    const encontrado = ROTULOS_DOMINIO.find(([padrao]) => padrao.test(dominio));
    return encontrado ? encontrado[1] : "Site";
  } catch {
    return "Site";
  }
}

// Formato oficial de URL cross-platform do Google Maps: abre o app no
// celular e o site no desktop, já traçando a rota até as coordenadas.
export function urlComoChegar(ponto) {
  return `https://www.google.com/maps/dir/?api=1&destination=${ponto.latitude}%2C${ponto.longitude}`;
}
