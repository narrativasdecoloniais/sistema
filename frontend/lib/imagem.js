// Redimensiona uma imagem para um quadrado (recorte central) e retorna um
// data URI JPEG comprimido, pronto para ser enviado como string no perfil.
export function redimensionarParaDataUri(arquivo, dimensaoMax = 256, qualidade = 0.82) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onerror = () => reject(new Error("Arquivo não é uma imagem válida."));
      imagem.onload = () => {
        const lado = Math.min(imagem.width, imagem.height);
        const origemX = (imagem.width - lado) / 2;
        const origemY = (imagem.height - lado) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = dimensaoMax;
        canvas.height = dimensaoMax;
        canvas
          .getContext("2d")
          .drawImage(imagem, origemX, origemY, lado, lado, 0, 0, dimensaoMax, dimensaoMax);

        resolve(canvas.toDataURL("image/jpeg", qualidade));
      };
      imagem.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

// Redimensiona uma logo mantendo a proporção original (sem recorte) e
// preservando transparência quando o arquivo for PNG/WebP/SVG — diferente de
// redimensionarParaDataUri, que recorta em quadrado e força JPEG (adequado
// para foto de perfil, não para logo institucional retangular).
export function redimensionarLogoParaDataUri(arquivo, dimensaoMax = 480, qualidadeJpeg = 0.9) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onerror = () => reject(new Error("Arquivo não é uma imagem válida."));
      imagem.onload = () => {
        const escala = Math.min(1, dimensaoMax / Math.max(imagem.width, imagem.height));
        const largura = Math.round(imagem.width * escala);
        const altura = Math.round(imagem.height * escala);

        const canvas = document.createElement("canvas");
        canvas.width = largura;
        canvas.height = altura;
        canvas.getContext("2d").drawImage(imagem, 0, 0, largura, altura);

        const manterTransparencia = ["image/png", "image/webp", "image/svg+xml"].includes(arquivo.type);
        resolve(
          manterTransparencia
            ? canvas.toDataURL("image/png")
            : canvas.toDataURL("image/jpeg", qualidadeJpeg)
        );
      };
      imagem.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}
