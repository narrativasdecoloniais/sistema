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
};

function decodificarDataUri(dataUri) {
  const [cabecalho, base64] = dataUri.split(",");
  const contentType = cabecalho.slice("data:".length, cabecalho.indexOf(";"));
  const extensao = EXTENSOES_POR_TIPO[contentType] || "jpg";
  return { buffer: Buffer.from(base64, "base64"), contentType, extensao };
}

async function salvarImagemPublica(dataUri, pasta) {
  const { buffer, contentType, extensao } = decodificarDataUri(dataUri);
  const nomeArquivo = `${pasta}/${crypto.randomUUID()}.${extensao}`;
  await bucketPublico.file(nomeArquivo).save(buffer, {
    contentType,
    metadata: { cacheControl: "public, max-age=31536000" },
  });
  return `https://storage.googleapis.com/${bucketPublico.name}/${nomeArquivo}`;
}

async function removerImagemPublica(url) {
  if (!url) return;
  const prefixo = `https://storage.googleapis.com/${bucketPublico.name}/`;
  if (!url.startsWith(prefixo)) return;
  const caminho = url.slice(prefixo.length);
  await bucketPublico.file(caminho).delete({ ignoreNotFound: true });
}

async function salvarImagemPrivada(dataUri, pasta) {
  const { buffer, contentType, extensao } = decodificarDataUri(dataUri);
  const caminho = `${pasta}/${crypto.randomUUID()}.${extensao}`;
  await bucketPrivado.file(caminho).save(buffer, { contentType });
  return caminho;
}

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
  salvarImagemPublica,
  removerImagemPublica,
  salvarImagemPrivada,
  removerImagemPrivada,
  gerarUrlAssinada,
};
