// Fallback de título/corpo das dobras sem customização até dez/2026 —
// reproduz o texto que era hardcoded em PaginaInicialConteudo.jsx antes de
// virar campo do model Edicao, pra migrar sem apagar o texto institucional
// de nenhuma edição existente (só passa a valer o texto salvo no admin
// quando alguém preencher titulo*/corpo* por lá).
const TITULO_APRESENTACAO_PADRAO = "Sobre o evento";
const CORPO_APRESENTACAO_PADRAO = `O evento aborda a educação em perspectiva intercultural, decolonial e antirracista, reunindo diferentes sujeitos e epistemes em debates transdisciplinares, diálogos de saberes, vivências e intercâmbios de experiências. Com foco nas relações étnico-raciais, nos saberes e práticas educativas de povos e comunidades tradicionais, bem como em temas como justiça climática, bem viver, ações afirmativas, decolonização do conhecimento, justiça epistêmica e equidade de gênero, configura-se como um espaço de encontro, diálogo e criação coletiva.

Por meio de conferências, conversatórios, oficinas, narrativas multimodais, exposições e atividades culturais, o evento fortalece a cooperação acadêmica Sul-Sul e a construção compartilhada de conhecimentos, contribuindo para a qualificação da educação pública e para o desenvolvimento de práticas pedagógicas comprometidas com a justiça social, racial e climática.`;

const TITULO_MODALIDADES_PADRAO = "Submissão";
const CORPO_MODALIDADES_PADRAO =
  "Compartilhe pesquisas, práticas e experiências nas modalidades desta edição.";

const TITULO_PUBLICACOES_PADRAO = "Anais e Memória";
const CORPO_PUBLICACOES_PADRAO =
  "Em breve abriremos a chamada para submissão de trabalhos desta edição. Os anais das edições anteriores serão disponibilizados aqui assim que organizados.";

const TITULO_COMISSOES_PADRAO = "Comissões";
const CORPO_COMISSOES_PADRAO = "Conheça as comissões organizadoras desta edição.";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function requisitarPublico(caminho) {
  const resposta = await fetch(`${API_URL}${caminho}`, { cache: "no-store" });
  if (!resposta.ok) return null;
  return resposta.json();
}

export async function buscarEdicaoAtual() {
  const dados = await requisitarPublico("/publico/edicao-atual");
  return dados?.edicao || null;
}

export async function listarEdicoesAnteriores() {
  const dados = await requisitarPublico("/publico/edicoes-anteriores");
  return dados?.edicoes || [];
}

export async function listarProgramasPosGraduacaoPublico() {
  const dados = await requisitarPublico("/publico/programas-pos-graduacao");
  return dados?.programas || [];
}

export async function listarAtividadesPublicas() {
  const dados = await requisitarPublico("/publico/edicao-atual/atividades");
  return dados?.atividades || [];
}

export async function buscarAtividadePublicaPorSlug(slug) {
  const dados = await requisitarPublico(`/publico/edicao-atual/atividades/${slug}`);
  return dados?.atividade || null;
}

export async function buscarEdicaoPorSlug(slug) {
  const dados = await requisitarPublico(`/publico/edicoes/${slug}`);
  return dados?.edicao || null;
}

export async function listarAtividadesPorEdicaoSlug(slug) {
  const dados = await requisitarPublico(`/publico/edicoes/${slug}/atividades`);
  return dados?.atividades || [];
}

export async function buscarAtividadeDaEdicao(edicaoSlug, atividadeSlug) {
  const dados = await requisitarPublico(`/publico/edicoes/${edicaoSlug}/atividades/${atividadeSlug}`);
  return dados?.atividade || null;
}

export async function listarModalidadesSubmissaoPublicas() {
  const dados = await requisitarPublico("/publico/edicao-atual/modalidades-submissao");
  return dados?.modalidades || [];
}

export async function buscarModalidadeSubmissaoPublicaPorSlug(slug) {
  const dados = await requisitarPublico(`/publico/edicao-atual/modalidades-submissao/${slug}`);
  return dados?.modalidade || null;
}

export async function listarComissoesPublicas() {
  const dados = await requisitarPublico("/publico/edicao-atual/comissoes");
  return dados?.comissoes || [];
}

// Monta as props de PaginaInicialConteudo a partir de uma edição (atual ou
// não) — única fonte de verdade dos fallbacks visuais, reaproveitada tanto
// pela home quanto pela página de edição por slug.
export function montarPropsPaginaEdicao(edicao, atividades, ehEdicaoAtual) {
  const realizadores = edicao?.realizadores || [];
  const apoiadores = edicao?.apoiadores || [];
  const pontosInteresse = edicao?.pontosInteresse || [];

  return {
    atividades,
    realizadores,
    corFundoRealizadores: edicao?.corFundoRealizadores || "BARRO",
    opacidadeFundoRealizadores: edicao?.opacidadeFundoRealizadores ?? 100,
    mostrarFaixaRealizadores: edicao?.mostrarFaixaRealizadores ?? true,
    apoiadores,
    corFundoApoiadores: edicao?.corFundoApoiadores || "BARRO",
    opacidadeFundoApoiadores: edicao?.opacidadeFundoApoiadores ?? 100,
    mostrarFaixaApoiadores: edicao?.mostrarFaixaApoiadores ?? true,
    pontosInteresse,
    logoSvg: edicao?.logoSvg,
    logoSvgViewBox: edicao?.logoSvgViewBox,
    logoSvgCores: edicao?.logoSvgCores,
    corFundoHero: edicao?.corFundoHero || "PAPEL",
    opacidadeFundoHero: edicao?.opacidadeFundoHero ?? 100,
    fundoHeroTipo: edicao?.fundoHeroTipo || "COR",
    imagemFundoHeroDesktop: edicao?.imagemFundoHeroDesktop,
    imagemFundoHeroMobile: edicao?.imagemFundoHeroMobile,
    corTextoHero: edicao?.corTextoHero || "TINTA",
    corBuzioHero: edicao?.corBuzioHero || "BUZIO",
    faixaHeroTipoDesktop: edicao?.faixaHeroTipoDesktop || "COR",
    corFaixaHeroDesktop: edicao?.corFaixaHeroDesktop || "OCRE",
    imagemFaixaHeroDesktop: edicao?.imagemFaixaHeroDesktop,
    larguraFaixaHeroDesktop: edicao?.larguraFaixaHeroDesktop ?? 96,
    faixaHeroTipoMobile: edicao?.faixaHeroTipoMobile || "COR",
    corFaixaHeroMobile: edicao?.corFaixaHeroMobile || "OCRE",
    imagemFaixaHeroMobile: edicao?.imagemFaixaHeroMobile,
    larguraFaixaHeroMobile: edicao?.larguraFaixaHeroMobile ?? 40,
    mostrarFaixaHero: edicao?.mostrarFaixaHero ?? true,
    tituloApresentacao: edicao?.tituloApresentacao || TITULO_APRESENTACAO_PADRAO,
    corpoApresentacao: edicao?.corpoApresentacao || CORPO_APRESENTACAO_PADRAO,
    corFundoApresentacao: edicao?.corFundoApresentacao || "PAPEL",
    opacidadeFundoApresentacao: edicao?.opacidadeFundoApresentacao ?? 100,
    corTextoApresentacao: edicao?.corTextoApresentacao || "TINTA",
    corBuzioApresentacao: edicao?.corBuzioApresentacao || "BARRO",
    corFundoBotaoApresentacao: edicao?.corFundoBotaoApresentacao || "BARRO",
    corTextoBotaoApresentacao: edicao?.corTextoBotaoApresentacao || "PAPEL",
    mostrarFaixaApresentacao: edicao?.mostrarFaixaApresentacao ?? true,
    tituloModalidades: edicao?.tituloModalidades || TITULO_MODALIDADES_PADRAO,
    corpoModalidades: edicao?.corpoModalidades || CORPO_MODALIDADES_PADRAO,
    corFundoModalidades: edicao?.corFundoModalidades || "PAPEL",
    opacidadeFundoModalidades: edicao?.opacidadeFundoModalidades ?? 100,
    corTextoModalidades: edicao?.corTextoModalidades || "TINTA",
    corBuzioModalidades: edicao?.corBuzioModalidades || "BUZIO",
    mostrarFaixaModalidades: edicao?.mostrarFaixaModalidades ?? true,
    corFundoCardModalidades: edicao?.corFundoCardModalidades || "OCRE",
    opacidadeFundoCardModalidades: edicao?.opacidadeFundoCardModalidades ?? 6,
    corTextoCardModalidades: edicao?.corTextoCardModalidades || "TINTA",
    corTextoSecundarioCardModalidades: edicao?.corTextoSecundarioCardModalidades || "TINTA",
    corAcentoCardModalidades: edicao?.corAcentoCardModalidades || "BARRO",
    corFundoBotaoCardModalidades: edicao?.corFundoBotaoCardModalidades || "BARRO",
    corTextoBotaoCardModalidades: edicao?.corTextoBotaoCardModalidades || "PAPEL",
    corFundoAgenda: edicao?.corFundoAgenda || "PAPEL",
    opacidadeFundoAgenda: edicao?.opacidadeFundoAgenda ?? 100,
    corTextoAgenda: edicao?.corTextoAgenda || "TINTA",
    corBuzioAgenda: edicao?.corBuzioAgenda || "BUZIO",
    mostrarFaixaAgenda: edicao?.mostrarFaixaAgenda ?? true,
    corFundoCardAgenda: edicao?.corFundoCardAgenda || "OCRE",
    opacidadeFundoCardAgenda: edicao?.opacidadeFundoCardAgenda ?? 6,
    corTextoCardAgenda: edicao?.corTextoCardAgenda || "TINTA",
    corTextoSecundarioCardAgenda: edicao?.corTextoSecundarioCardAgenda || "TINTA",
    corAcentoCardAgenda: edicao?.corAcentoCardAgenda || "BARRO",
    tituloPublicacoes: edicao?.tituloPublicacoes || TITULO_PUBLICACOES_PADRAO,
    corpoPublicacoes: edicao?.corpoPublicacoes || CORPO_PUBLICACOES_PADRAO,
    corFundoPublicacoes: edicao?.corFundoPublicacoes || "PAPEL",
    opacidadeFundoPublicacoes: edicao?.opacidadeFundoPublicacoes ?? 100,
    corTextoPublicacoes: edicao?.corTextoPublicacoes || "TINTA",
    corBuzioPublicacoes: edicao?.corBuzioPublicacoes || "BUZIO",
    mostrarFaixaPublicacoes: edicao?.mostrarFaixaPublicacoes ?? true,
    corFundoLocalizacao: edicao?.corFundoLocalizacao || "PAPEL",
    opacidadeFundoLocalizacao: edicao?.opacidadeFundoLocalizacao ?? 100,
    corTextoLocalizacao: edicao?.corTextoLocalizacao || "TINTA",
    mostrarFaixaLocalizacao: edicao?.mostrarFaixaLocalizacao ?? true,
    tituloComissoes: edicao?.tituloComissoes || TITULO_COMISSOES_PADRAO,
    corpoComissoes: edicao?.corpoComissoes || CORPO_COMISSOES_PADRAO,
    corFundoComissoes: edicao?.corFundoComissoes || "PAPEL",
    opacidadeFundoComissoes: edicao?.opacidadeFundoComissoes ?? 100,
    corTextoComissoes: edicao?.corTextoComissoes || "TINTA",
    corBuzioComissoes: edicao?.corBuzioComissoes || "BUZIO",
    mostrarFaixaComissoes: edicao?.mostrarFaixaComissoes ?? true,
    temEdicaoAtual: Boolean(ehEdicaoAtual),
    edicaoSlug: edicao?.slug,
    dataEvento: formatarPeriodoEdicao(edicao?.dataInicio, edicao?.dataFim),
    localEvento: formatarLocalEdicao(edicao),
    realizacaoEvento: formatarRealizacao(realizadores),
  };
}

// Cores da navbar por edição — separado de montarPropsPaginaEdicao porque a
// navbar não é renderizada por PaginaInicialConteudo (é global, no layout);
// ver EdicaoExibidaContext.jsx pra como isso chega em BarraNavegacao.jsx.
// larguraFaixa* também vai aqui (não é "cor", mas a navbar precisa do mesmo
// valor que a Hero usa pra faixa lateral, pra ajustar o próprio padding e
// não ficar por baixo dela — ver .heroFaixa em page.module.scss). Zera por
// eixo quando a Hero não exibe faixa (mostrarFaixaHero) ou não tem faixa
// configurada pro breakpoint (tipo "NENHUMA") — mesmo ajuste de
// PaginaInicialConteudo.jsx/DetalheAtividade.jsx, senão a navbar reservava o
// espaço à toa.
export function montarPropsNavegacao(edicao) {
  const mostrarFaixaHero = edicao?.mostrarFaixaHero ?? true;
  const faixaHeroTipoMobile = edicao?.faixaHeroTipoMobile || "COR";
  const faixaHeroTipoDesktop = edicao?.faixaHeroTipoDesktop || "COR";

  return {
    larguraFaixaDesktop:
      mostrarFaixaHero && faixaHeroTipoDesktop !== "NENHUMA"
        ? (edicao?.larguraFaixaHeroDesktop ?? 96)
        : 0,
    larguraFaixaMobile:
      mostrarFaixaHero && faixaHeroTipoMobile !== "NENHUMA"
        ? (edicao?.larguraFaixaHeroMobile ?? 40)
        : 0,
    topo: {
      fundoTipo: edicao?.fundoNavTopoTipo || "TRANSPARENTE",
      corFundo: edicao?.corFundoNavTopo || "PAPEL",
      corTexto: edicao?.corTextoNavTopo || "TINTA",
      corIcone: edicao?.corIconeNavTopo || "TINTA",
      corBorda: edicao?.corBordaNavTopo || "TINTA",
    },
    rolado: {
      corFundo: edicao?.corFundoNavRolado || "CERRADO",
      corTexto: edicao?.corTextoNavRolado || "PAPEL",
      corIcone: edicao?.corIconeNavRolado || "BUZIO",
      corBorda: edicao?.corBordaNavRolado || "BUZIO",
    },
    navMesmoEstilo: Boolean(edicao?.navMesmoEstilo),
    corFundoBotaoNav: edicao?.corFundoBotaoNav || "BARRO",
    corTextoBotaoNav: edicao?.corTextoBotaoNav || "PAPEL",
  };
}

export function formatarPeriodoEdicao(dataInicioIso, dataFimIso) {
  if (!dataInicioIso) return "Data a confirmar";

  const inicio = new Date(dataInicioIso);
  const fim = dataFimIso ? new Date(dataFimIso) : null;
  const formatadorCompleto = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  if (!fim || fim.toDateString() === inicio.toDateString()) {
    return formatadorCompleto.format(inicio);
  }

  const mesmoMes =
    inicio.getUTCFullYear() === fim.getUTCFullYear() && inicio.getUTCMonth() === fim.getUTCMonth();

  const formatadorInicio = new Intl.DateTimeFormat(
    "pt-BR",
    mesmoMes
      ? { day: "numeric", timeZone: "UTC" }
      : { day: "numeric", month: "long", timeZone: "UTC" }
  );

  return `${formatadorInicio.format(inicio)} a ${formatadorCompleto.format(fim)}`;
}

export function formatarLocalEdicao(edicao) {
  if (!edicao) return null;
  if (edicao.modalidade === "ONLINE") return "Online";

  const cidadeEstado = [edicao.cidade, edicao.estado].filter(Boolean).join("-");
  const partes = [edicao.local, cidadeEstado].filter(Boolean);
  return partes.length > 0 ? partes.join(" · ") : null;
}

export function formatarRealizacao(realizadores = []) {
  if (realizadores.length === 0) return "Realização: GPDES/UnB";
  return `Realização: ${realizadores.map((realizador) => realizador.nome).join(", ")}`;
}

export function formatarPeriodoAtividade(inicioIso, fimIso) {
  const inicio = new Date(inicioIso);
  const fim = new Date(fimIso);

  const formatadorCompleto = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  const mesmoDia = inicio.toISOString().slice(0, 10) === fim.toISOString().slice(0, 10);
  if (mesmoDia) {
    const formatadorHora = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
    return `${formatadorCompleto.format(inicio)} até ${formatadorHora.format(fim)}`;
  }

  return `${formatadorCompleto.format(inicio)} até ${formatadorCompleto.format(fim)}`;
}

export function formatarHoraAtividade(iso) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function formatarHoraCurta(iso) {
  const data = new Date(iso);
  const hora = data.getUTCHours();
  const minuto = data.getUTCMinutes();
  return minuto === 0 ? `${hora}h` : `${hora}h${String(minuto).padStart(2, "0")}`;
}

export function formatarFaixaHorario(inicioIso, fimIso) {
  return `${formatarHoraCurta(inicioIso)} às ${formatarHoraCurta(fimIso)}`;
}

// Agrupa por horário de início idêntico (não por sobreposição — uma
// atividade longa tipo "8h às 18h" não deve "engolir" todo o resto do dia
// num carrossel só; ver agruparAtividadesSimultaneas em lib/inscricao.js
// para o caso de detecção de conflito, que é outro problema). Usado pela
// timeline da seção "Programação" da home pública: cada horário distinto
// vira uma linha; quando mais de uma atividade começa no mesmo horário,
// a linha vira um carrossel.
function agruparPorInicioIdentico(atividades) {
  const porInicio = new Map();

  for (const atividade of atividades) {
    const chave = atividade.inicioAtividade;
    if (!chave) continue;
    if (!porInicio.has(chave)) porInicio.set(chave, []);
    porInicio.get(chave).push(atividade);
  }

  return Array.from(porInicio.entries())
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([inicioIso, itens]) => ({
      inicioIso,
      atividades: [...itens].sort((a, b) =>
        a.tipoAtividade.nome.localeCompare(b.tipoAtividade.nome, "pt-BR")
      ),
    }));
}

// Atividades contínuas vêm primeiro na programação do dia, cada uma com
// sua própria linha de horário — só depois entram as demais, agrupadas como
// sempre. Cada partição é agrupada com a mesma lógica de horário idêntico,
// então duas contínuas no mesmo horário+tipo ainda caem no mesmo
// carrossel entre si.
export function agruparAtividadesPorHorarioInicio(atividades = []) {
  const continuas = atividades.filter((atividade) => atividade.atividadeContinua);
  const normais = atividades.filter((atividade) => !atividade.atividadeContinua);
  return [...agruparPorInicioIdentico(continuas), ...agruparPorInicioIdentico(normais)];
}

// Agrupa pessoas envolvidas numa atividade pelo tipo de participação —
// cada grupo vira sua própria seção com o tipo como título, em vez de uma
// lista única "Pessoas envolvidas" (o rótulo do tipo já identifica cada
// pessoa, então não precisa repetir em cada cartão). Pessoas sem tipo
// definido caem num grupo à parte ao final.
export function agruparPessoasPorTipoParticipacao(pessoas = []) {
  const porTipo = new Map();

  for (const pessoa of pessoas) {
    const chave = pessoa.tipoParticipacao?.id ?? "sem-tipo";
    const rotulo = pessoa.tipoParticipacao?.nome ?? "Outros participantes";
    if (!porTipo.has(chave)) porTipo.set(chave, { rotulo, pessoas: [] });
    porTipo.get(chave).pessoas.push(pessoa);
  }

  return Array.from(porTipo.values());
}

// Datas de prazo de submissão são só dia (sem hora relevante) — timeZone
// UTC fixo pra não perder/ganhar um dia por causa do fuso do navegador.
export function formatarPeriodoSubmissao(dataInicioIso, dataFimIso) {
  const formatador = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
  return `${formatador.format(new Date(dataInicioIso))} – ${formatador.format(new Date(dataFimIso))}`;
}

// Corpo de texto livre (descrição de modalidade/área, corpoApresentacao
// etc.) é sempre um único campo String no banco — parágrafos separados por
// linha em branco, divididos aqui só na hora de renderizar.
export function dividirParagrafos(texto) {
  return (texto || "")
    .split(/\n\s*\n/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean);
}

export function formatarDiaAtividade(iso) {
  const data = new Date(iso);
  const diaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" })
    .format(data)
    .replace(/\.$/, "");
  const dataCurta = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(data);
  const completo = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(data);
  return { diaSemana, dataCurta, completo };
}

