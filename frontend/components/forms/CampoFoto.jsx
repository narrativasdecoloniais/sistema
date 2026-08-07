"use client";

import { useRef, useState } from "react";
import Avatar from "@/components/interno/Avatar";
import Botao from "./Botao";
import { redimensionarParaDataUri } from "@/lib/imagem";
import styles from "./CampoFoto.module.scss";

const TAMANHO_MAX_ARQUIVO = 5 * 1024 * 1024;
const DIMENSAO_MAX = 256;
const QUALIDADE_JPEG = 0.82;

export default function CampoFoto({ id, rotulo, usuario, valor, onChange, erro }) {
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
    if (arquivo.size > TAMANHO_MAX_ARQUIVO) {
      setErroLocal("A imagem deve ter no máximo 5MB.");
      return;
    }

    setProcessando(true);
    try {
      onChange(await redimensionarParaDataUri(arquivo, DIMENSAO_MAX, QUALIDADE_JPEG));
    } catch {
      setErroLocal("Não foi possível processar essa imagem. Tente outro arquivo.");
    } finally {
      setProcessando(false);
    }
  }

  function removerFoto() {
    setErroLocal("");
    onChange(null);
  }

  return (
    <div className={styles.grupo}>
      <span className={styles.rotulo}>{rotulo}</span>
      <div className={styles.linha}>
        <Avatar usuario={{ nome: usuario?.nome, foto: valor }} tamanho={96} />
        <div className={styles.acoes}>
          <Botao
            type="button"
            variante="secundario"
            carregando={processando}
            onClick={() => inputRef.current?.click()}
          >
            Escolher foto
          </Botao>
          {valor && (
            <Botao type="button" variante="perigo" onClick={removerFoto}>
              Remover foto
            </Botao>
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
      {(erroLocal || erro) && <p className={styles.mensagemErro}>{erroLocal || erro}</p>}
    </div>
  );
}
