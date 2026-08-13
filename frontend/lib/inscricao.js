import { apiClient } from "@/lib/apiClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function requisitar(caminho, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const resposta = await fetch(`${API_URL}${caminho}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(dados?.mensagem || "Ocorreu um erro. Tente novamente.");
  }

  return dados;
}

export function buscarCpf(cpf) {
  return requisitar("/publico/inscricao/cpf", { method: "POST", body: { cpf } });
}

export function confirmarEmailExistente({ cpf, email }) {
  return requisitar("/publico/inscricao/confirmar-email", { method: "POST", body: { cpf, email } });
}

export function cadastrarParaInscricao(dados) {
  return requisitar("/publico/inscricao/cadastro", { method: "POST", body: dados });
}

// Usa o cookie de sessão (login), não o token de inscrição — por isso passa
// pelo apiClient (credentials: "include") em vez de requisitar() com Bearer.
export function buscarTokenPorSessao() {
  return apiClient.get("/publico/inscricao/token-por-sessao");
}

export function buscarEstadoInscricao(token) {
  return requisitar("/publico/inscricao/estado", { token });
}

export function finalizarInscricao(token, atividadeIds) {
  return requisitar("/publico/inscricao/finalizar", {
    method: "POST",
    token,
    body: { atividadeIds },
  });
}

export function cancelarInscricaoAtividade(token, inscricaoAtividadeId) {
  return requisitar(`/publico/inscricao/atividades/${inscricaoAtividadeId}`, {
    method: "DELETE",
    token,
  });
}

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
        (a, b) => new Date(a.inicioAtividade) - new Date(b.inicioAtividade)
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
export function agruparAtividadesSimultaneas(atividades = []) {
  const ordenadas = [...atividades].sort(
    (a, b) => new Date(a.inicioAtividade) - new Date(b.inicioAtividade)
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
