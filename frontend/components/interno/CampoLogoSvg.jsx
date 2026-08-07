"use client";

import { useRef, useState } from "react";
import { Button } from "primereact/button";
import stylesCampo from "./CampoPrime.module.scss";
import styles from "./CampoLogo.module.scss";

const TAMANHO_MAX_ARQUIVO = 300 * 1024;

// Só serve pra pré-visualização local imediata do arquivo escolhido — <img>
// nunca executa script embutido, mesmo antes de o SVG passar pela
// sanitização do backend (ver sanitizarSvgLogo.js).
function paraDataUri(texto) {
  const base64 = btoa(unescape(encodeURIComponent(texto)));
  return `data:image/svg+xml;base64,${base64}`;
}

export default function CampoLogoSvg({ id, rotulo, temLogoAtual, onChange, erro }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [erroLocal, setErroLocal] = useState("");

  async function selecionarArquivo(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;

    setErroLocal("");

    const pareceSvg = arquivo.type === "image/svg+xml" || arquivo.name.toLowerCase().endsWith(".svg");
    if (!pareceSvg) {
      setErroLocal("Selecione um arquivo .svg.");
      return;
    }
    if (arquivo.size > TAMANHO_MAX_ARQUIVO) {
      setErroLocal("O arquivo SVG deve ter no máximo 300KB.");
      return;
    }

    try {
      const texto = await arquivo.text();
      setPreviewUrl(paraDataUri(texto));
      onChange(texto);
    } catch {
      setErroLocal("Não foi possível ler esse arquivo. Tente outro SVG.");
    }
  }

  function remover() {
    setErroLocal("");
    setPreviewUrl(null);
    onChange(null);
  }

  return (
    <div className={stylesCampo.grupo}>
      <span className={stylesCampo.rotulo}>{rotulo}</span>
      <div className={styles.linha}>
        <div className={styles.preview}>
          {previewUrl ? (
            <img src={previewUrl} alt="" className={styles.imagem} />
          ) : (
            <span className={styles.semImagem}>Nenhum arquivo selecionado</span>
          )}
        </div>
        <div className={styles.acoes}>
          <Button
            type="button"
            label="Escolher arquivo SVG"
            onClick={() => inputRef.current?.click()}
            pt={{ root: { className: styles.botaoSecundario } }}
          />
          {(temLogoAtual || previewUrl) && (
            <Button
              type="button"
              label="Remover logo customizada"
              onClick={remover}
              pt={{ root: { className: styles.botaoPerigo } }}
            />
          )}
        </div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept=".svg,image/svg+xml"
          className={styles.inputOculto}
          onChange={selecionarArquivo}
        />
      </div>
      {(erroLocal || erro) && <p className={stylesCampo.mensagemErro}>{erroLocal || erro}</p>}
    </div>
  );
}
