"use client";

import { useRef, useState } from "react";
import { Button } from "primereact/button";
import { redimensionarLogoParaDataUri } from "@/lib/imagem";
import stylesCampo from "./CampoPrime.module.scss";
import styles from "./CampoLogo.module.scss";

const TAMANHO_MAX_ARQUIVO_PADRAO = 5 * 1024 * 1024;
const DIMENSAO_MAX_PADRAO = 480;

// dimensaoMax/tamanhoMaxArquivo existem pra reaproveitar esse campo em
// imagens bem maiores que uma logo institucional (ex. fundo full-bleed da
// Hero, até 2560px — ver CampoFundoHero.jsx). textoItem troca "logo" pelo
// nome do que está sendo enviado nos rótulos (Escolher/Remover/Sem ...).
export default function CampoLogo({
  id,
  rotulo,
  valor,
  onChange,
  erro,
  permiteRemover = true,
  dimensaoMax = DIMENSAO_MAX_PADRAO,
  tamanhoMaxArquivo = TAMANHO_MAX_ARQUIVO_PADRAO,
  textoItem = "logo",
}) {
  const inputRef = useRef(null);
  const [processando, setProcessando] = useState(false);
  const [erroLocal, setErroLocal] = useState("");

  async function selecionarArquivo(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;

    setErroLocal("");

    if (!arquivo.type.startsWith("image/")) {
      setErroLocal("Selecione um arquivo de imagem.");
      return;
    }
    if (arquivo.size > tamanhoMaxArquivo) {
      setErroLocal(`A imagem deve ter no máximo ${Math.round(tamanhoMaxArquivo / (1024 * 1024))}MB.`);
      return;
    }

    setProcessando(true);
    try {
      onChange(await redimensionarLogoParaDataUri(arquivo, dimensaoMax));
    } catch {
      setErroLocal("Não foi possível processar essa imagem. Tente outro arquivo.");
    } finally {
      setProcessando(false);
    }
  }

  function removerLogo() {
    setErroLocal("");
    onChange(null);
  }

  return (
    <div className={stylesCampo.grupo}>
      <span className={stylesCampo.rotulo}>{rotulo}</span>
      <div className={styles.linha}>
        <div className={styles.preview}>
          {valor ? (
            <img src={valor} alt="" className={styles.imagem} />
          ) : (
            <span className={styles.semImagem}>Sem {textoItem}</span>
          )}
        </div>
        <div className={styles.acoes}>
          <Button
            type="button"
            label={processando ? "Aguarde..." : `Escolher ${textoItem}`}
            disabled={processando}
            onClick={() => inputRef.current?.click()}
            pt={{ root: { className: styles.botaoSecundario } }}
          />
          {valor && permiteRemover && (
            <Button
              type="button"
              label={`Remover ${textoItem}`}
              onClick={removerLogo}
              pt={{ root: { className: styles.botaoPerigo } }}
            />
          )}
        </div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/*"
          className={styles.inputOculto}
          onChange={selecionarArquivo}
        />
      </div>
      {(erroLocal || erro) && <p className={stylesCampo.mensagemErro}>{erroLocal || erro}</p>}
    </div>
  );
}
