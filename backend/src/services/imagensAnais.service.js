const sharp = require("sharp");
const ErroHttp = require("../utils/erroHttp");
const storageService = require("./storage.service");

// Capa e imagens de cabeçalho/rodapé dos trabalhos nos Anais, enviadas pela
// organização nas Configurações. Opcionais: sem capa o PDF/Word começa na
// folha de rosto, sem cabeçalho/rodapé as páginas dos trabalhos ficam só com
// o cabeçalho textual e o número da página.
//
// Ao salvar, cada arquivo é normalizado pelo sharp e vai pro bucket público
// (pasta anais-imagens); na geração, anaisDocumento.service.js carrega daqui
// já com as dimensões que o PDF/Word precisam.

const PASTA = "anais-imagens";

// A4 retrato.
const PROPORCAO_CAPA = 297 / 210;

const CAMPOS = {
  // Página inteira: JPEG (sem transparência), até A4 a 300 dpi.
  imagemCapa: { rotulo: "da capa", dimensaoMax: 3508, jpeg: true },
  // Faixas na largura da página: até 2480 px (A4 a 300 dpi); PNG mantém a
  // transparência, que faz sentido numa arte sobre o papel.
  imagemCabecalho: { rotulo: "do cabeçalho", dimensaoMax: 2480, jpeg: false },
  imagemRodape: { rotulo: "do rodapé", dimensaoMax: 2480, jpeg: false },
};

const DATA_URI_RASTER = /^data:image\/(png|jpeg|webp);base64,/;

async function normalizar(buffer, { dimensaoMax, jpeg, rotulo }) {
  try {
    let pipeline = sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({ width: dimensaoMax, height: dimensaoMax, fit: "inside", withoutEnlargement: true });
    const { hasAlpha } = await sharp(buffer, { failOn: "none" }).metadata();
    const comoJpeg = jpeg || !hasAlpha;
    pipeline = comoJpeg
      ? pipeline.flatten({ background: "#ffffff" }).jpeg({ quality: 88, mozjpeg: true })
      : pipeline.png({ compressionLevel: 9 });
    const data = await pipeline.toBuffer();
    return { buffer: data, contentType: comoJpeg ? "image/jpeg" : "image/png", extensao: comoJpeg ? "jpg" : "png" };
  } catch {
    throw new ErroHttp(400, `Não foi possível ler a imagem ${rotulo}. Envie um arquivo PNG ou JPG válido.`);
  }
}

// Resolve os três campos do formulário contra o que já está salvo:
// data URI = arquivo novo (sobe já), a mesma URL = sem mudança, null =
// remover. Devolve os valores pro banco, os arquivos recém-enviados (pra
// desfazer se o salvamento falhar) e os antigos a remover depois que salvar.
async function prepararImagens(atual, dados) {
  const campos = {};
  const novos = [];
  const substituidos = [];
  try {
    for (const [campo, config] of Object.entries(CAMPOS)) {
      const valor = dados[campo] ?? null;
      const anterior = atual?.[campo] ?? null;
      if (valor === anterior) {
        campos[campo] = anterior;
        continue;
      }
      if (valor === null) {
        campos[campo] = null;
      } else if (DATA_URI_RASTER.test(valor)) {
        const { buffer } = storageService.decodificarDataUri(valor);
        const normalizado = await normalizar(buffer, config);
        const url = await storageService.salvarBufferPublico(normalizado.buffer, normalizado.contentType, normalizado.extensao, PASTA);
        novos.push(url);
        campos[campo] = url;
      } else {
        throw new ErroHttp(400, `Imagem ${config.rotulo} inválida. Envie o arquivo novamente.`);
      }
      if (anterior) substituidos.push(anterior);
    }
  } catch (erro) {
    await descartar(novos);
    throw erro;
  }
  return { campos, novos, substituidos };
}

async function descartar(urls) {
  for (const url of urls) {
    await storageService.removerImagemPublica(url).catch((erro) =>
      console.error("[anais] falha ao remover imagem:", erro.message)
    );
  }
}

// Lê do bucket e mede. A capa é recortada (centralizada) na proporção do A4
// pra preencher a página sem distorcer. Imagem que não carregar fica de fora
// da geração em vez de derrubá-la.
async function carregarImagem(url, { capa = false } = {}) {
  if (!url) return null;
  try {
    const buffer = await storageService.lerArquivoPublico(url);
    let entrada = sharp(buffer, { failOn: "none" });
    const { width, height, format } = await entrada.metadata();
    if (capa && Math.abs(height / width - PROPORCAO_CAPA) > 0.01) {
      const largura = Math.min(width, Math.round(height / PROPORCAO_CAPA));
      entrada = entrada.resize({ width: largura, height: Math.round(largura * PROPORCAO_CAPA), fit: "cover" });
    }
    const jpeg = format === "jpeg";
    const { data, info } = await (jpeg ? entrada.jpeg({ quality: 90 }) : entrada.png()).toBuffer({ resolveWithObject: true });
    return { dados: data, formato: jpeg ? "jpg" : "png", largura: info.width, altura: info.height };
  } catch (erro) {
    console.error(`[anais] imagem ignorada (${url.slice(-60)}):`, erro.message);
    return null;
  }
}

async function carregarImagensDocumento(anais, { capa = true } = {}) {
  const [imagemCapa, cabecalho, rodape] = await Promise.all([
    capa ? carregarImagem(anais.imagemCapa, { capa: true }) : null,
    carregarImagem(anais.imagemCabecalho),
    carregarImagem(anais.imagemRodape),
  ]);
  return { capa: imagemCapa, cabecalho, rodape };
}

module.exports = { prepararImagens, descartar, carregarImagensDocumento };
