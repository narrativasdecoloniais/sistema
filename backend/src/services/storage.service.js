const crypto = require("crypto");
const { Storage } = require("@google-cloud/storage");
const env = require("../config/env");

const storage = new Storage({
  projectId: env.gcsProjectId,
  credentials: env.gcsCredentials,
});

const bucketPublico = storage.bucket(env.gcsBucketPublico);
const bucketPrivado = storage.bucket(env.gcsBucketPrivado);

const EXTENSOES_POR_TIPO = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

function decodificarDataUri(dataUri) {
  const [cabecalho, base64] = dataUri.split(",");
  const contentType = cabecalho.slice("data:".length, cabecalho.indexOf(";"));
  const extensao = EXTENSOES_POR_TIPO[contentType] || "jpg";
  return { buffer: Buffer.from(base64, "base64"), contentType, extensao };
}

const PREFIXO_PUBLICO = `https://storage.googleapis.com/${bucketPublico.name}/`;

// Arquivo já processado no servidor (ex. fundo de certificado convertido pelo
// sharp) — mesmo destino e cache de salvarImagemPublica.
// nomeDownload (opcional) vira o nome sugerido ao baixar (Content-Disposition)
// — ex. os Anais em PDF/Word, que senão baixariam com o uuid como nome.
async function salvarBufferPublico(buffer, contentType, extensao, pasta, { nomeDownload } = {}) {
  const nomeArquivo = `${pasta}/${crypto.randomUUID()}.${extensao}`;
  await bucketPublico.file(nomeArquivo).save(buffer, {
    contentType,
    metadata: {
      cacheControl: "public, max-age=31536000",
      ...(nomeDownload ? { contentDisposition: `attachment; filename="${nomeDownload.replace(/"/g, "")}"` } : {}),
    },
  });
  return `${PREFIXO_PUBLICO}${nomeArquivo}`;
}

async function salvarImagemPublica(dataUri, pasta) {
  const { buffer, contentType, extensao } = decodificarDataUri(dataUri);
  return salvarBufferPublico(buffer, contentType, extensao, pasta);
}

function ehUrlPublica(url) {
  return typeof url === "string" && url.startsWith(PREFIXO_PUBLICO);
}

async function removerImagemPublica(url) {
  if (!ehUrlPublica(url)) return;
  const caminho = url.slice(PREFIXO_PUBLICO.length);
  await bucketPublico.file(caminho).delete({ ignoreNotFound: true });
}

// Lê um arquivo do bucket público pelo client (credenciais do servidor), sem
// passar por HTTP — usado pra montar PDFs com imagens já enviadas.
async function lerArquivoPublico(url) {
  if (!ehUrlPublica(url)) throw new Error("URL fora do bucket público.");
  const [buffer] = await bucketPublico.file(url.slice(PREFIXO_PUBLICO.length)).download();
  return buffer;
}

async function salvarImagemPrivada(dataUri, pasta) {
  const { buffer, contentType, extensao } = decodificarDataUri(dataUri);
  const caminho = `${pasta}/${crypto.randomUUID()}.${extensao}`;
  await bucketPrivado.file(caminho).save(buffer, { contentType });
  return caminho;
}

// Documento privado (ex. autorização de responsável da monitoria): mesmo
// bucket e mesma leitura por URL assinada das imagens privadas — o nome só
// deixa claro que aceita PDF. Quem chama valida tipo e tamanho antes.
const salvarArquivoPrivado = salvarImagemPrivada;

async function removerImagemPrivada(caminho) {
  if (!caminho) return;
  await bucketPrivado.file(caminho).delete({ ignoreNotFound: true });
}

async function gerarUrlAssinada(caminho) {
  if (!caminho) return null;
  const [url] = await bucketPrivado.file(caminho).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1000,
  });
  return url;
}

module.exports = {
  decodificarDataUri,
  salvarBufferPublico,
  salvarImagemPublica,
  removerImagemPublica,
  lerArquivoPublico,
  ehUrlPublica,
  salvarImagemPrivada,
  removerImagemPrivada,
  salvarArquivoPrivado,
  removerArquivoPrivado: removerImagemPrivada,
  gerarUrlAssinada,
};
