// Marcadores ({{chave}}) aceitos no texto de cada tipo de certificado, com a
// descrição mostrada no admin. Os valores vêm do snapshot guardado em
// Certificado.dados (certificadosElegiveis.js), mais codigo/dataEmissao/
// cargaHoraria resolvidos na hora de desenhar (certificados.service.js).

const COMUNS = [
  { chave: "nome", descricao: "nome de quem recebe" },
  { chave: "documento", descricao: "CPF ou documento de estrangeiro" },
  { chave: "edicao", descricao: "nome da edição" },
  { chave: "numeroEdicao", descricao: "número da edição em romanos (ex. V)" },
  { chave: "periodoEvento", descricao: "período do evento (ex. de 10 a 12 de novembro de 2026)" },
  { chave: "local", descricao: "local do evento" },
  { chave: "cidade", descricao: "cidade/UF do evento" },
  { chave: "cargaHoraria", descricao: "carga horária, só o número de horas" },
  { chave: "dataEmissao", descricao: "data de emissão (ex. 15 de dezembro de 2026)" },
  { chave: "codigo", descricao: "código de validação" },
];

const ESPECIFICOS = {
  PARTICIPACAO_EVENTO: [],
  PRESENCA_ATIVIDADE: [
    { chave: "atividade", descricao: "nome da atividade" },
    { chave: "tipoAtividade", descricao: "tipo da atividade (ex. Oficina)" },
    { chave: "dataAtividade", descricao: "data da atividade (ex. em 11 de novembro de 2026)" },
  ],
  APRESENTACAO_TRABALHO: [
    { chave: "titulo", descricao: "título do trabalho" },
    { chave: "autores", descricao: "todos os autores (ex. Ana Souza, João Lima e Maria Reis)" },
    { chave: "modalidade", descricao: "modalidade de submissão" },
    { chave: "area", descricao: "área temática" },
    { chave: "atividade", descricao: "atividade em que o trabalho foi apresentado" },
  ],
  AVALIADOR: [
    { chave: "trabalhosAvaliados", descricao: "quantidade de trabalhos avaliados" },
    { chave: "areas", descricao: "áreas temáticas do avaliador" },
  ],
  MONITOR: [{ chave: "funcoes", descricao: "funções da monitoria" }],
  ATUACAO_ATIVIDADE: [
    { chave: "funcao", descricao: "tipo de participação (ex. Mediador(a), Conferencista)" },
    { chave: "atividade", descricao: "nome da atividade" },
    { chave: "tipoAtividade", descricao: "tipo da atividade (ex. Mesa-redonda)" },
    { chave: "dataAtividade", descricao: "data da atividade (ex. em 11 de novembro de 2026)" },
  ],
  EQUIPE_EVENTO: [{ chave: "funcao", descricao: "função na equipe (ex. Comissão Organizadora)" }],
};

function marcadoresDoTipo(tipo) {
  return [...COMUNS, ...(ESPECIFICOS[tipo] || [])];
}

const MARCADORES_POR_TIPO = Object.fromEntries(
  Object.keys(ESPECIFICOS).map((tipo) => [tipo, marcadoresDoTipo(tipo)])
);

const REGEX_MARCADOR = /\{\{\s*(\w+)\s*\}\}/g;

// Marcadores usados no texto que não existem para o tipo (erro de digitação,
// ou copiado de outro tipo).
function marcadoresDesconhecidos(tipo, texto) {
  const validos = new Set(marcadoresDoTipo(tipo).map((m) => m.chave));
  const usados = [...String(texto || "").matchAll(REGEX_MARCADOR)].map((m) => m[1]);
  return [...new Set(usados.filter((chave) => !validos.has(chave)))];
}

function substituirMarcadores(texto, valores) {
  return texto.replace(REGEX_MARCADOR, (original, chave) =>
    Object.prototype.hasOwnProperty.call(valores, chave) ? String(valores[chave] ?? "") : original
  );
}

// ---------------------------------------------------------------------------
// Formatação dos valores
// ---------------------------------------------------------------------------

// Datas do evento/atividade são "ingênuas" (horário de Brasília gravado como
// UTC — ver horarioBrasilia.js), por isso a leitura em UTC.
const formatoDia = new Intl.DateTimeFormat("pt-BR", { day: "numeric", timeZone: "UTC" });
const formatoDiaMes = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" });
const formatoCompleto = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatarDataLonga(data) {
  return data ? formatoCompleto.format(new Date(data)) : "";
}

// Momento real (ex. emissão), não ingênuo.
function formatarDataLongaBrasilia(data) {
  return data
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(data))
    : "";
}

function chaveDia(data) {
  return new Date(data).toISOString().slice(0, 10);
}

// "em 10 de novembro de 2026", "de 10 a 12 de novembro de 2026",
// "de 30 de outubro a 2 de novembro de 2026".
function formatarPeriodo(inicio, fim) {
  if (!inicio && !fim) return "";
  if (!inicio || !fim || chaveDia(inicio) === chaveDia(fim)) {
    return `em ${formatarDataLonga(inicio || fim)}`;
  }
  const a = new Date(inicio);
  const b = new Date(fim);
  if (a.getUTCFullYear() !== b.getUTCFullYear()) {
    return `de ${formatarDataLonga(a)} a ${formatarDataLonga(b)}`;
  }
  if (a.getUTCMonth() !== b.getUTCMonth()) {
    return `de ${formatoDiaMes.format(a)} a ${formatarDataLonga(b)}`;
  }
  return `de ${formatoDia.format(a)} a ${formatarDataLonga(b)}`;
}

function romano(numero) {
  if (!Number.isInteger(numero) || numero <= 0 || numero >= 4000) return numero ? String(numero) : "";
  const tabela = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let resto = numero;
  let resultado = "";
  for (const [valor, simbolo] of tabela) {
    while (resto >= valor) {
      resultado += simbolo;
      resto -= valor;
    }
  }
  return resultado;
}

// "Ana", "Ana e João", "Ana, João e Maria".
function juntarLista(itens) {
  const lista = itens.filter(Boolean);
  if (lista.length <= 1) return lista[0] || "";
  return `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}`;
}

const nomesPaises = new Intl.DisplayNames(["pt-BR"], { type: "region" });

function formatarDocumento(usuario) {
  if (!usuario) return "";
  if (usuario.cpf && /^\d{11}$/.test(usuario.cpf)) {
    return usuario.cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  if (usuario.documentoEstrangeiro) {
    let pais = "";
    try {
      pais = usuario.pais ? nomesPaises.of(usuario.pais) : "";
    } catch {
      pais = usuario.pais || "";
    }
    return pais ? `${usuario.documentoEstrangeiro} (${pais})` : usuario.documentoEstrangeiro;
  }
  return "";
}

module.exports = {
  MARCADORES_POR_TIPO,
  marcadoresDoTipo,
  marcadoresDesconhecidos,
  substituirMarcadores,
  formatarDataLonga,
  formatarDataLongaBrasilia,
  formatarPeriodo,
  romano,
  juntarLista,
  formatarDocumento,
};
