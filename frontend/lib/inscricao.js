import { compararPorOrdemDaAtividade } from "@/lib/publico";

// Sobreposição parcial conta como conflito; um horário que termina
// exatamente quando o outro começa não conta. Mesma lógica de
// backend/src/services/inscricoes.service.js#haSobreposicao — manter
// sincronizado se mudar.
export function haSobreposicao(a, b) {
  const inicioA = new Date(a.inicioAtividade);
  const fimA = new Date(a.fimAtividade);
  const inicioB = new Date(b.inicioAtividade);
  const fimB = new Date(b.fimAtividade);
  return inicioA < fimB && inicioB < fimA;
}

// Dia-calendário em UTC — mesma convenção de formatarPeriodoAtividade em
// lib/publico.js. Evita que o fuso do navegador jogue uma atividade de fim
// de noite pro dia seguinte.
function chaveDiaUTC(iso) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");
  return `${data.getUTCFullYear()}-${mes}-${dia}`;
}

// Agrupa atividades por dia-calendário, ordenadas por início dentro do dia.
// Atividades sem inicioAtividade válido são descartadas.
export function agruparAtividadesPorDia(atividades = []) {
  const porChave = new Map();

  for (const atividade of atividades) {
    const chave = chaveDiaUTC(atividade.inicioAtividade);
    if (!chave) continue;
    if (!porChave.has(chave)) porChave.set(chave, []);
    porChave.get(chave).push(atividade);
  }

  return Array.from(porChave.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, itens]) => {
      const ordenadas = [...itens].sort(
        (a, b) =>
          new Date(a.inicioAtividade) - new Date(b.inicioAtividade) ||
          compararPorOrdemDaAtividade(a, b)
      );
      return { chave, inicioIso: ordenadas[0].inicioAtividade, atividades: ordenadas };
    });
}

// Agrupa atividades que se sobrepõem no tempo, com transitividade: se A
// sobrepõe C e B não sobrepõe C, mas B sobrepõe A, os três caem no mesmo
// grupo. Varredura por "referência" = atividade de MAIOR fim já vista no
// grupo corrente (não a anterior imediata, que pode ser curta e "furar" o
// grupo: A 9h-12h, B 9h30-10h, C 11h-11h30 — C não sobrepõe B, mas sobrepõe
// A e precisa ficar no mesmo grupo). Reaproveita haSobreposicao pra nunca
// descolar da definição de conflito usada no resto do fluxo.
function agruparPorSobreposicao(atividades) {
  const ordenadas = [...atividades].sort(
    (a, b) =>
      new Date(a.inicioAtividade) - new Date(b.inicioAtividade) ||
      compararPorOrdemDaAtividade(a, b)
  );

  const grupos = [];
  let grupoAtual = [];
  let referencia = null;

  for (const atividade of ordenadas) {
    if (referencia && haSobreposicao(atividade, referencia)) {
      grupoAtual.push(atividade);
      if (new Date(atividade.fimAtividade) > new Date(referencia.fimAtividade)) {
        referencia = atividade;
      }
      continue;
    }
    if (grupoAtual.length > 0) grupos.push(grupoAtual);
    grupoAtual = [atividade];
    referencia = atividade;
  }

  if (grupoAtual.length > 0) grupos.push(grupoAtual);
  return grupos;
}

// Atividades contínuas vêm primeiro na programação do dia, cada uma com
// sua própria linha de horário — só depois entram as demais. Cada partição
// é agrupada com a mesma lógica de sobreposição, então duas contínuas
// simultâneas ainda caem no mesmo grupo (carrossel) entre si.
export function agruparAtividadesSimultaneas(atividades = []) {
  const continuas = atividades.filter((atividade) => atividade.atividadeContinua);
  const normais = atividades.filter((atividade) => !atividade.atividadeContinua);
  return [...agruparPorSobreposicao(continuas), ...agruparPorSobreposicao(normais)];
}
