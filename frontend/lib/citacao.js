// Espelho de backend/src/utils/citacao.js (que usa no "Como citar" do
// PDF/Word) — aqui serve o painel "Citar" da página do artigo nos Anais.
// Mudou lá, muda aqui. Referências: ABNT (NBR 6023:2018, trabalho apresentado
// em evento), APA 7, BibTeX e RIS.
//
// Entrada comum:
// {
//   titulo, autores: [nome],
//   anais: { titulo, nomeEvento, numeroEdicao, anoEvento, cidadeEvento,
//            localPublicacao, editora, anoPublicacao, issn, isbn },
//   paginaInicial, paginaFinal, url, acessoEm (Date)
// }
//
// ABNT e APA saem como lista de trechos { texto, destaque } — o destaque
// (negrito na ABNT, itálico na APA) é o título dos Anais; quem exibe decide
// se vira <strong>/<em> ou texto puro (ver textoCitacao/htmlCitacao).

const SUFIXOS = new Set(["junior", "júnior", "jr", "jr.", "filho", "neto", "sobrinho", "segundo", "terceiro"]);
const PARTICULAS = new Set(["da", "de", "do", "das", "dos", "e", "d'", "del", "della", "di", "du", "van", "von", "la", "le"]);
const MESES_ABNT = ["jan.", "fev.", "mar.", "abr.", "maio", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];

function limpar(texto) {
  return String(texto ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function semPontoFinal(texto) {
  return limpar(texto).replace(/[.\s]+$/, "");
}

function maiusculas(texto) {
  return limpar(texto).toLocaleUpperCase("pt-BR");
}

// Nome cadastrado todo em maiúsculas ("MARIA DA SILVA") vira "Maria da Silva"
// antes de montar a referência — senão o prenome também sairia em caixa alta.
function capitalizarNome(palavra) {
  const minuscula = palavra.toLocaleLowerCase("pt-BR");
  if (PARTICULAS.has(minuscula)) return minuscula;
  return minuscula
    .split("-")
    .map((parte) => parte.charAt(0).toLocaleUpperCase("pt-BR") + parte.slice(1))
    .join("-");
}

// Separa "Maria Aparecida da Silva Júnior" em
// { sobrenome: "Silva Júnior", prenomes: ["Maria", "Aparecida", "da"] }.
// Sobrenome = último nome (mais o sufixo de parentesco, se houver); partículas
// ficam no prenome, como manda a NBR 6023 ("SILVA, Maria da").
export function separarNome(nomeCompleto) {
  let palavras = limpar(nomeCompleto).split(" ").filter(Boolean);
  if (!palavras.length) return { sobrenome: "", prenomes: [] };
  const nome = palavras.join(" ");
  if (nome === nome.toLocaleUpperCase("pt-BR") || nome === nome.toLocaleLowerCase("pt-BR")) {
    palavras = palavras.map(capitalizarNome);
  }
  if (palavras.length === 1) return { sobrenome: palavras[0], prenomes: [] };

  let inicioSobrenome = palavras.length - 1;
  if (SUFIXOS.has(palavras[inicioSobrenome].toLocaleLowerCase("pt-BR")) && palavras.length > 2) {
    inicioSobrenome -= 1;
  }
  return {
    sobrenome: palavras.slice(inicioSobrenome).join(" "),
    prenomes: palavras.slice(0, inicioSobrenome),
  };
}

export function autorAbnt(nome) {
  const { sobrenome, prenomes } = separarNome(nome);
  const sobrenomeMaiusculo = maiusculas(sobrenome);
  return prenomes.length ? `${sobrenomeMaiusculo}, ${prenomes.join(" ")}` : sobrenomeMaiusculo;
}

function iniciais(prenomes) {
  return prenomes
    .filter((palavra) => !PARTICULAS.has(palavra.toLocaleLowerCase("pt-BR")))
    .map((palavra) =>
      palavra
        .split("-")
        .map((parte) => `${parte.charAt(0).toLocaleUpperCase("pt-BR")}.`)
        .join("-")
    )
    .join(" ");
}

function autorApa(nome) {
  const { sobrenome, prenomes } = separarNome(nome);
  const letras = iniciais(prenomes);
  return letras ? `${sobrenome}, ${letras}` : sobrenome;
}

function autorBibliografico(nome) {
  const { sobrenome, prenomes } = separarNome(nome);
  return prenomes.length ? `${sobrenome}, ${prenomes.join(" ")}` : sobrenome;
}

function paginas(dados, separador) {
  const { paginaInicial, paginaFinal } = dados;
  if (!paginaInicial) return "";
  return paginaFinal && paginaFinal !== paginaInicial
    ? `${paginaInicial}${separador}${paginaFinal}`
    : String(paginaInicial);
}

function dataAcessoAbnt(data) {
  const d = data instanceof Date ? data : new Date(data || Date.now());
  return `${d.getDate()} ${MESES_ABNT[d.getMonth()]} ${d.getFullYear()}`;
}

function anoPublicacao(anais) {
  return anais.anoPublicacao || anais.anoEvento || "";
}

// SOBRENOME, Nome; SOBRENOME, Nome. Título do trabalho. In: NOME DO EVENTO,
// 5., 2026, Brasília. **Anais [...]**. Brasília: Editora, 2026. p. 10-18.
// ISSN 1234-5678. Disponível em: https://… . Acesso em: 30 set. 2026.
export function citacaoAbnt(dados) {
  const { anais } = dados;
  const autores = (dados.autores || []).map(autorAbnt).filter(Boolean).join("; ");
  const evento = [
    maiusculas(anais.nomeEvento || anais.titulo),
    anais.numeroEdicao ? `${anais.numeroEdicao}.` : "",
    anais.anoEvento ? String(anais.anoEvento) : "",
    limpar(anais.cidadeEvento),
  ]
    .filter(Boolean)
    .join(", ");
  const imprenta = [
    [limpar(anais.localPublicacao) || "[S. l.]", limpar(anais.editora) || "[s. n.]"].join(": "),
    anoPublicacao(anais),
  ]
    .filter(Boolean)
    .join(", ");

  const trechos = [];
  if (autores) trechos.push({ texto: `${autores}. ` });
  trechos.push({ texto: `${semPontoFinal(dados.titulo)}. In: ${evento}. ` });
  trechos.push({ texto: semPontoFinal(anais.titulo), destaque: true });
  let resto = `. ${imprenta}.`;
  const intervalo = paginas(dados, "-");
  if (intervalo) resto += ` p. ${intervalo}.`;
  if (anais.issn) resto += ` ISSN ${anais.issn}.`;
  if (anais.isbn) resto += ` ISBN ${anais.isbn}.`;
  if (dados.url) resto += ` Disponível em: ${dados.url}. Acesso em: ${dataAcessoAbnt(dados.acessoEm)}.`;
  trechos.push({ texto: resto });
  return trechos;
}

function listaApa(nomes) {
  const formatados = nomes.map(autorApa).filter(Boolean);
  if (formatados.length <= 1) return formatados.join("");
  if (formatados.length === 2) return `${formatados[0]}, & ${formatados[1]}`;
  if (formatados.length <= 20) return `${formatados.slice(0, -1).join(", ")}, & ${formatados.at(-1)}`;
  return `${formatados.slice(0, 19).join(", ")}, . . . ${formatados.at(-1)}`;
}

// Silva, M., & Souza, J. (2026). Título do trabalho. In *Anais do …*
// (pp. 10–18). Editora. https://…
export function citacaoApa(dados) {
  const { anais } = dados;
  const autores = listaApa(dados.autores || []);
  const ano = anoPublicacao(anais) || "s.d.";
  const trechos = [{ texto: `${autores ? `${autores} ` : ""}(${ano}). ${semPontoFinal(dados.titulo)}. In ` }];
  trechos.push({ texto: semPontoFinal(anais.titulo), destaque: true });
  let resto = "";
  const intervalo = paginas(dados, "–");
  if (intervalo) resto += ` (${intervalo.includes("–") ? "pp." : "p."} ${intervalo})`;
  resto += ".";
  if (anais.editora) resto += ` ${semPontoFinal(anais.editora)}.`;
  if (dados.url) resto += ` ${dados.url}`;
  trechos.push({ texto: resto });
  return trechos;
}

export function textoCitacao(trechos) {
  return trechos.map((trecho) => trecho.texto).join("");
}

const MAPA_HTML = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, (caractere) => MAPA_HTML[caractere]);
}

export function htmlCitacao(trechos, tagDestaque = "strong") {
  return trechos
    .map((trecho) =>
      trecho.destaque ? `<${tagDestaque}>${escapar(trecho.texto)}</${tagDestaque}>` : escapar(trecho.texto)
    )
    .join("");
}

function semAcento(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function chaveBibtex(dados) {
  const primeiro = separarNome((dados.autores || [])[0] || "anon").sobrenome.split(" ")[0];
  const palavra = semPontoFinal(dados.titulo)
    .split(" ")
    .find((p) => p.length > 3 && !PARTICULAS.has(p.toLocaleLowerCase("pt-BR")));
  return [primeiro, anoPublicacao(dados.anais), palavra]
    .map((parte) => semAcento(parte).replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean)
    .join("")
    .toLowerCase();
}

function escaparBibtex(texto) {
  return limpar(texto).replace(/([{}\\&%$#_])/g, "\\$1");
}

export function citacaoBibtex(dados) {
  const { anais } = dados;
  const campos = [
    ["author", (dados.autores || []).map(autorBibliografico).join(" and ")],
    ["title", semPontoFinal(dados.titulo)],
    ["booktitle", semPontoFinal(anais.titulo)],
    ["year", anoPublicacao(anais)],
    ["pages", paginas(dados, "--")],
    ["publisher", anais.editora],
    ["address", anais.localPublicacao],
    ["issn", anais.issn],
    ["isbn", anais.isbn],
    ["url", dados.url],
  ].filter(([, valor]) => valor !== undefined && valor !== null && String(valor).trim() !== "");

  const linhas = campos.map(([campo, valor]) => {
    const conteudo = campo === "url" ? String(valor) : escaparBibtex(valor);
    return `  ${campo} = {${conteudo}}`;
  });
  return `@inproceedings{${chaveBibtex(dados) || "trabalho"},\n${linhas.join(",\n")}\n}\n`;
}

export function citacaoRis(dados) {
  const { anais } = dados;
  const linhas = [["TY", "CPAPER"]];
  for (const nome of dados.autores || []) linhas.push(["AU", autorBibliografico(nome)]);
  linhas.push(["TI", semPontoFinal(dados.titulo)]);
  linhas.push(["T2", semPontoFinal(anais.titulo)]);
  if (anais.nomeEvento) linhas.push(["C3", limpar(anais.nomeEvento)]);
  if (anoPublicacao(anais)) linhas.push(["PY", String(anoPublicacao(anais))]);
  if (dados.paginaInicial) linhas.push(["SP", String(dados.paginaInicial)]);
  if (dados.paginaFinal) linhas.push(["EP", String(dados.paginaFinal)]);
  if (anais.editora) linhas.push(["PB", limpar(anais.editora)]);
  if (anais.localPublicacao) linhas.push(["CY", limpar(anais.localPublicacao)]);
  if (anais.issn || anais.isbn) linhas.push(["SN", anais.issn || anais.isbn]);
  if (dados.url) linhas.push(["UR", dados.url]);
  linhas.push(["LA", "pt"]);
  linhas.push(["ER", ""]);
  return `${linhas.map(([tag, valor]) => `${tag}  - ${valor}`.trimEnd()).join("\r\n")}\r\n`;
}
