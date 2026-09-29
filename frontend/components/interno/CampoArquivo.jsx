"use client";

import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import Botao from "@/components/forms/Botao";
import stylesCampo from "./CampoPrime.module.scss";
import styles from "./CampoArquivo.module.scss";

const TIPOS_PADRAO = ["application/pdf", "image/png", "image/jpeg"];
const TAMANHO_MAX_PADRAO = 5 * 1024 * 1024;

function lerComoDataUri(arquivo) {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader();
    leitor.onload = () => resolver(leitor.result);
    leitor.onerror = () => rejeitar(leitor.error);
    leitor.readAsDataURL(arquivo);
  });
}

// Anexo de documento (sem redimensionar, diferente de CampoFoto): lê o arquivo
// como data URI e entrega em onChange({ nome, dataUri }). `arquivoSalvo`
// indica que já existe um anexo no servidor (ex. ao editar a inscrição).
export default function CampoArquivo({
  id,
  rotulo,
  descricao,
  valor,
  onChange,
  erro,
  arquivoSalvo = false,
  tipos = TIPOS_PADRAO,
  tamanhoMax = TAMANHO_MAX_PADRAO,
}) {
  const inputRef = useRef(null);
  const [erroLocal, setErroLocal] = useState("");
  const [lendo, setLendo] = useState(false);
  const mensagemErro = erroLocal || erro;
  const idErro = `${id}-erro`;
  const idDescricao = `${id}-descricao`;

  async function selecionar(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    setErroLocal("");

    if (!tipos.includes(arquivo.type)) {
      setErroLocal("Envie o arquivo em PDF, JPG ou PNG.");
      return;
    }
    if (arquivo.size > tamanhoMax) {
      setErroLocal(`O arquivo deve ter no máximo ${Math.round(tamanhoMax / 1024 / 1024)}MB.`);
      return;
    }

    setLendo(true);
    try {
      onChange({ nome: arquivo.name, dataUri: await lerComoDataUri(arquivo) });
    } catch {
      setErroLocal("Não foi possível ler esse arquivo. Tente outro.");
    } finally {
      setLendo(false);
    }
  }

  return (
    <div className={stylesCampo.grupo}>
      <span className={stylesCampo.rotulo} id={`${id}-rotulo`}>
        {rotulo}
      </span>
      {descricao && (
        <p id={idDescricao} className={styles.descricao}>
          {descricao}
        </p>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={tipos.join(",")}
        className={styles.inputOculto}
        onChange={selecionar}
        aria-labelledby={`${id}-rotulo`}
        aria-describedby={[descricao ? idDescricao : null, mensagemErro ? idErro : null].filter(Boolean).join(" ") || undefined}
        aria-invalid={mensagemErro ? "true" : undefined}
      />
      <div className={styles.linha}>
        <Botao type="button" variante="secundario" carregando={lendo} onClick={() => inputRef.current?.click()}>
          <Paperclip size={18} strokeWidth={1.5} aria-hidden="true" />
          {valor || arquivoSalvo ? "Trocar arquivo" : "Escolher arquivo"}
        </Botao>
        {valor ? (
          <span className={styles.nomeArquivo}>
            {valor.nome}
            <button
              type="button"
              className={styles.remover}
              aria-label={`Remover ${valor.nome}`}
              onClick={() => onChange(null)}
            >
              <X size={14} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </span>
        ) : (
          arquivoSalvo && <span className={styles.nomeArquivo}>Arquivo já enviado</span>
        )}
      </div>
      {mensagemErro && (
        <p id={idErro} className={stylesCampo.mensagemErro}>
          {mensagemErro}
        </p>
      )}
    </div>
  );
}
