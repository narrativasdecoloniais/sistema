"use client";

import { RadioButton } from "primereact/radiobutton";
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

// Fundo de seção usa a mesma paleta pública completa (CorSecao e CorPublica
// têm os mesmos valores no schema Prisma, mantidos como enums separados por
// representarem usos distintos — fundo x texto/ícone).
export const OPCOES_COR_SECAO = OPCOES_COR_PUBLICA;

export default function CampoCorSecao({ id, rotulo, valor, onChange, opcoes = OPCOES_COR_SECAO }) {
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
              checked={valor === opcao.valor}
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
      </div>
    </div>
  );
}
