const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");

// Janela headless dedicada à sanitização — não serve nenhuma página, só dá a
// DOMPurify um DOM real pra rodar em Node.
const DOMPurify = createDOMPurify(new JSDOM("").window);

const TAMANHO_MAX_ENTRADA = 300_000;

// A logo enviada pelo gestor é a arte final colorida (ver Logo.jsx) — a
// sanitização aqui é só sobre segurança, não remove fill/stroke/gradiente.
// Fora do FORBID_TAGS: script/handlers (XSS), foreignObject/image (podem
// embutir HTML ou raster arbitrário), style (CSS externo via @import),
// use/defs (evita ter que validar referências internas), pattern/filter
// (podem referenciar recursos), a/text/tspan/textPath (navegação e fontes,
// fora do escopo de um símbolo vetorial simples).
const CONFIG_SANITIZACAO = {
  USE_PROFILES: { svg: true },
  FORBID_TAGS: [
    "script", "foreignObject", "image", "style", "use", "defs",
    "pattern", "filter", "a", "text", "tspan", "textPath",
  ],
};

const ELEMENTOS_DE_FORMA = new Set([
  "path", "rect", "circle", "ellipse", "polygon", "polyline", "line",
]);

function contemForma(elemento) {
  for (const filho of elemento.children) {
    const tag = filho.tagName.toLowerCase();
    if (ELEMENTOS_DE_FORMA.has(tag)) return true;
    if (contemForma(filho)) return true;
  }
  return false;
}

const PROPRIEDADES_COR = ["fill", "stroke", "stop-color"];
const VALORES_IGNORADOS = new Set(["none", "transparent", "currentcolor", ""]);
const LIMITE_CORES = 12;

// Normaliza pra hex de 6 dígitos (o que <input type="color"> no admin exige)
// quando possível — hex de 3/6 dígitos e rgb()/rgba(). Outros formatos (nome
// de cor CSS, hsl(), etc.) devolvem null: a cor ainda é extraída/reescrita
// pro SVG funcionar, só que o admin não vai conseguir editá-la depois sem
// antes escolher uma cor nova no seletor (ver CampoCoresLogo.jsx).
function normalizarParaHex(valor) {
  const v = valor.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();

  const curto = v.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (curto) {
    const [, r, g, b] = curto;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  const rgb = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    const [, r, g, b] = rgb;
    return `#${[r, g, b].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
  }

  return null;
}

function valorUtilizavel(valor) {
  const v = valor.trim();
  return v && !VALORES_IGNORADOS.has(v.toLowerCase()) && !v.startsWith("var(") && !v.startsWith("url(");
}

// Extrai as cores distintas usadas em fill/stroke/stop-color (presentation
// attribute ou inline style) e reescreve cada ocorrência pra var(--logo-cor-N)
// — permite editar as cores depois (PATCH em logoSvgCores) sem reenviar o
// arquivo. fill="url(#gradiente)" não é tocado (referência, não cor sólida).
function extrairERecolorir(svgRaiz) {
  const porValorOriginal = new Map();
  let contador = 0;

  function variavelPara(valorOriginal) {
    const chave = valorOriginal.trim().toLowerCase();
    if (porValorOriginal.has(chave)) return porValorOriginal.get(chave).nome;
    if (contador >= LIMITE_CORES) return null;
    contador += 1;
    const nome = `--logo-cor-${contador}`;
    porValorOriginal.set(chave, { nome, hex: normalizarParaHex(valorOriginal) || "#000000" });
    return nome;
  }

  function processar(elemento) {
    for (const propriedade of PROPRIEDADES_COR) {
      const valor = elemento.getAttribute(propriedade);
      if (valor && valorUtilizavel(valor)) {
        const nome = variavelPara(valor);
        if (nome) elemento.setAttribute(propriedade, `var(${nome})`);
      }
    }

    const style = elemento.getAttribute("style");
    if (style) {
      let novoStyle = style;
      for (const propriedade of PROPRIEDADES_COR) {
        novoStyle = novoStyle.replace(
          new RegExp(`(^|;)(\\s*${propriedade}\\s*:\\s*)([^;]+)`, "i"),
          (match, prefixo, declaracao, valor) => {
            if (!valorUtilizavel(valor)) return match;
            const nome = variavelPara(valor);
            return nome ? `${prefixo}${declaracao}var(${nome})` : match;
          }
        );
      }
      elemento.setAttribute("style", novoStyle);
    }

    for (const filho of elemento.children) processar(filho);
  }

  processar(svgRaiz);

  const cores = {};
  for (const { nome, hex } of porValorOriginal.values()) cores[nome] = hex;
  return cores;
}

function extrairViewBox(svgRaiz) {
  const viewBox = svgRaiz.getAttribute("viewBox");
  if (viewBox && viewBox.trim()) return viewBox.trim();

  const largura = parseFloat(svgRaiz.getAttribute("width"));
  const altura = parseFloat(svgRaiz.getAttribute("height"));
  if (Number.isFinite(largura) && Number.isFinite(altura) && largura > 0 && altura > 0) {
    return `0 0 ${largura} ${altura}`;
  }

  return null;
}

// Sanitiza um SVG enviado pelo gestor e devolve só o markup interno (filhos
// da raiz <svg>, prontos pra ir num <svg viewBox={viewBox}> no frontend) e o
// viewBox original, usado pra renderizar a arte proporcionalmente. Lança
// Error com mensagem em português (o service converte em ErroHttp 400).
function sanitizarSvgLogo(svgTexto) {
  if (typeof svgTexto !== "string" || !svgTexto.trim()) {
    throw new Error("Envie um arquivo SVG.");
  }
  if (svgTexto.length > TAMANHO_MAX_ENTRADA) {
    throw new Error("O arquivo SVG é muito grande (máximo 300KB).");
  }

  const fragmento = DOMPurify.sanitize(svgTexto, { ...CONFIG_SANITIZACAO, RETURN_DOM_FRAGMENT: true });
  const svgRaiz = fragmento.querySelector("svg");
  if (!svgRaiz) {
    throw new Error("Arquivo inválido. Envie um SVG válido.");
  }

  const viewBox = extrairViewBox(svgRaiz);
  if (!viewBox) {
    throw new Error("O SVG precisa ter viewBox ou largura e altura definidas.");
  }

  if (!contemForma(svgRaiz)) {
    throw new Error(
      "O SVG não contém formas compatíveis. Evite scripts, imagens embutidas ou referências externas — use apenas formas vetoriais."
    );
  }

  const cores = extrairERecolorir(svgRaiz);

  return { markup: svgRaiz.innerHTML.trim(), viewBox, cores };
}

module.exports = sanitizarSvgLogo;
