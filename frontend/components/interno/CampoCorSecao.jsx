"use client";

import { useEffect, useState } from "react";
import { RadioButton } from "primereact/radiobutton";
import { ehCorPersonalizada } from "@/lib/cores";
import styles from "./CampoCorSecao.module.scss";

// Paleta pública completa (DESIGN.md) — usada tanto para fundo de seção
// quanto para texto/ícone (ex. Hero). O par de cor de texto correspondente a
// cada fundo é definido no CSS da página pública (page.module.scss), não
// aqui.
export const OPCOES_COR_PUBLICA = [
  { valor: "TINTA", rotulo: "Tinta", cor: "#201914" },
  { valor: "BARRO", rotulo: "Barro", cor: "#9C4A2F" },
  { valor: "OCRE", rotulo: "Ocre", cor: "#B87C34" },
  { valor: "BUZIO", rotulo: "Búzio", cor: "#EDB153" },
  { valor: "AREIA", rotulo: "Areia", cor: "#EDE4D4" },
  { valor: "PAPEL", rotulo: "Papel", cor: "#FAF6EE" },
  { valor: "CERRADO", rotulo: "Cerrado", cor: "#55603F" },
];

// Fundo de seção usa a mesma paleta pública completa — nome mantido separado
// só por refletir o uso distinto (fundo x texto/ícone) dos campos que o
// consomem.
export const OPCOES_COR_SECAO = OPCOES_COR_PUBLICA;

// Além dos swatches da paleta curada, um seletor nativo de cor livre
// ("Personalizada") — mesmo padrão de estado local + commit só no onBlur de
// CampoCoresLogo.jsx, pra não disparar um PATCH a cada tick de arraste no
// picker do navegador.
export default function CampoCorSecao({ id, rotulo, valor, onChange, opcoes = OPCOES_COR_SECAO }) {
  const personalizada = ehCorPersonalizada(valor);
  const [corLocal, setCorLocal] = useState(personalizada ? valor : "#000000");

  useEffect(() => {
    if (personalizada) setCorLocal(valor);
  }, [valor, personalizada]);

  return (
    <div className={styles.grupo}>
      <span className={styles.rotulo}>{rotulo}</span>
      <div className={styles.opcoes}>
        {opcoes.map((opcao) => (
          <label key={opcao.valor} className={styles.opcao} htmlFor={`${id}-${opcao.valor}`}>
            <RadioButton
              inputId={`${id}-${opcao.valor}`}
              name={id}
              value={opcao.valor}
              checked={!personalizada && valor === opcao.valor}
              onChange={(evento) => onChange(evento.value)}
              pt={{
                root: { className: styles.raiz },
                input: { className: styles.inputOculto },
                box: { className: styles.caixa, style: { background: opcao.cor } },
              }}
            />
            <span className={styles.rotuloOpcao}>{opcao.rotulo}</span>
          </label>
        ))}
        <label className={styles.opcao} htmlFor={`${id}-personalizada`}>
          <span className={styles.raizPersonalizada} data-selecionada={personalizada}>
            <input
              id={`${id}-personalizada`}
              type="color"
              value={corLocal}
              onChange={(evento) => setCorLocal(evento.target.value)}
              onBlur={(evento) => onChange(evento.target.value)}
              className={styles.seletorPersonalizado}
            />
          </span>
          <span className={styles.rotuloOpcao}>Personalizada</span>
        </label>
      </div>
    </div>
  );
}
