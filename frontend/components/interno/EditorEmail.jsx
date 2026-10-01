"use client";

import { useRef, useState } from "react";
import Botao from "@/components/forms/Botao";
import CampoRichText from "@/components/forms/CampoRichText";
import ConteudoRichText from "@/components/ConteudoRichText";
import CampoTexto from "./CampoTexto";
import { MARCADORES_EMAIL, preencherMarcadores } from "@/lib/emailsMassa";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilosResultado from "./ResultadoSubmissoesPainel.module.scss";

// Assunto + texto de um e-mail em massa, com os marcadores {{...}} inseridos
// no cursor e pré-visualização com os dados de `exemplo`. Usado no modelo
// (EmailsPainel) e no envio (EnviarEmailModal).
export default function EditorEmail({ idBase, assunto, corpo, onAssunto, onCorpo, erros = {}, exemplo }) {
  const editorRef = useRef(null);
  const [previsualizando, setPrevisualizando] = useState(false);

  return (
    <>
      <CampoTexto
        id={`${idBase}-assunto`}
        rotulo="Assunto"
        value={assunto}
        onChange={(evento) => onAssunto(evento.target.value)}
        erro={erros.assunto}
      />
      <div className={styles.blocoDetalhe}>
        <p className={styles.textoApoio}>
          Marcadores — clique para inserir no texto; no envio, cada um vira o dado da pessoa:
        </p>
        <ul className={estilosResultado.marcadores}>
          {MARCADORES_EMAIL.map(({ chave, descricao }) => (
            <li key={chave}>
              <button
                type="button"
                className={estilosResultado.marcador}
                onClick={() => editorRef.current?.inserirTexto(`{{${chave}}}`)}
              >
                <code>{`{{${chave}}}`}</code>
                <span>{descricao}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <CampoRichText
        ref={editorRef}
        id={`${idBase}-corpo`}
        rotulo="Texto do e-mail"
        value={corpo}
        onChange={onCorpo}
        erro={erros.corpo}
      />
      <div>
        <Botao type="button" variante="secundario" onClick={() => setPrevisualizando((atual) => !atual)}>
          {previsualizando ? "Fechar pré-visualização" : "Pré-visualizar"}
        </Botao>
      </div>
      {previsualizando && (
        <div className={styles.detalhe} aria-live="polite">
          <p className={styles.textoApoio}>
            Como chega para {exemplo.nome} ({exemplo.email}):
          </p>
          <p className={styles.nome}>{preencherMarcadores(assunto, exemplo, { html: false })}</p>
          <ConteudoRichText className={styles.corpo} html={preencherMarcadores(corpo, exemplo, { html: true })} tipo="texto" />
        </div>
      )}
    </>
  );
}
