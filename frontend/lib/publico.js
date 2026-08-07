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

export async function listarAtividadesPublicas() {
  const dados = await requisitarPublico("/publico/edicao-atual/atividades");
  return dados?.atividades || [];
}

export async function buscarAtividadePublicaPorSlug(slug) {
  const dados = await requisitarPublico(`/publico/edicao-atual/atividades/${slug}`);
  return dados?.atividade || null;
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

function formatarHoraCurta(iso) {
  const data = new Date(iso);
  const hora = data.getUTCHours();
  const minuto = data.getUTCMinutes();
  return minuto === 0 ? `${hora}h` : `${hora}h${String(minuto).padStart(2, "0")}min`;
}

export function formatarFaixaHorario(inicioIso, fimIso) {
  return `${formatarHoraCurta(inicioIso)} às ${formatarHoraCurta(fimIso)}`;
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

