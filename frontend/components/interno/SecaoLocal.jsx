"use client";

import { MapPin } from "lucide-react";
import { RadioButton } from "primereact/radiobutton";
import CampoTexto from "./CampoTexto";
import CabecalhoSecao from "./CabecalhoSecao";
import styles from "./EdicaoForm.module.scss";

const OPCOES_MODALIDADE = [
  { valor: "ONLINE", rotulo: "Online" },
  { valor: "PRESENCIAL", rotulo: "Presencial" },
  { valor: "HIBRIDO", rotulo: "Híbrido" },
];

export default function SecaoLocal({ edicao, erros, aoMudar, aoSalvar, aoMudarImediato }) {
  const mostrarEndereco = edicao.modalidade !== "ONLINE";

  return (
    <div className={styles.secao}>
      <CabecalhoSecao
        Icone={MapPin}
        titulo="Local"
        descricao="Ajude as pessoas a descobrirem onde o evento acontece e como chegar."
      />
      <div className={styles.camposSecao}>
        <div className={styles.grupoRadio}>
          {OPCOES_MODALIDADE.map((opcao) => (
            <label
              key={opcao.valor}
              className={styles.opcaoRadio}
              htmlFor={`modalidade-${opcao.valor}`}
            >
              <RadioButton
                inputId={`modalidade-${opcao.valor}`}
                name="modalidade"
                value={opcao.valor}
                checked={edicao.modalidade === opcao.valor}
                onChange={(evento) => aoMudarImediato("modalidade", evento.value)}
                pt={{
                  root: { className: styles.raizRadio },
                  input: { className: styles.inputOcultoRadio },
                  box: { className: styles.caixaRadio },
                }}
              />
              {opcao.rotulo}
            </label>
          ))}
        </div>
        {mostrarEndereco && (
          <>
            <CampoTexto
              id="local"
              rotulo="Local"
              value={edicao.local}
              onChange={(evento) => aoMudar("local", evento.target.value)}
              onBlur={aoSalvar}
              erro={erros.local}
            />
            <div className={styles.linha}>
              <CampoTexto
                id="pais"
                rotulo="País"
                value={edicao.pais}
                onChange={(evento) => aoMudar("pais", evento.target.value)}
                onBlur={aoSalvar}
                erro={erros.pais}
              />
              <CampoTexto
                id="estado"
                rotulo="Estado"
                value={edicao.estado}
                onChange={(evento) => aoMudar("estado", evento.target.value)}
                onBlur={aoSalvar}
                erro={erros.estado}
              />
              <CampoTexto
                id="cidade"
                rotulo="Cidade"
                value={edicao.cidade}
                onChange={(evento) => aoMudar("cidade", evento.target.value)}
                onBlur={aoSalvar}
                erro={erros.cidade}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
