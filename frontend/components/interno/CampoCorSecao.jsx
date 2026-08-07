"use client";

import { RadioButton } from "primereact/radiobutton";
import styles from "./CampoCorSecao.module.scss";

// Paleta curada do DESIGN.md para fundo de seção — --areia fica de fora
// (o próprio DESIGN.md proíbe usá-la como faixa de seção) e --buzio também
// (é assinatura, não fundo). O par de cor de texto correspondente a cada
// fundo é definido no CSS da página pública (page.module.scss), não aqui.
export const OPCOES_COR_SECAO = [
  { valor: "PAPEL", rotulo: "Papel", cor: "#FAF6EE" },
  { valor: "TINTA", rotulo: "Tinta", cor: "#201914" },
  { valor: "BARRO", rotulo: "Barro", cor: "#9C4A2F" },
  { valor: "OCRE", rotulo: "Ocre", cor: "#B87C34" },
  { valor: "CERRADO", rotulo: "Cerrado", cor: "#55603F" },
];

// Paleta pública completa — usada em campos de texto/ícone (ex. Hero), onde
// --buzio precisa estar disponível (é a cor padrão do próprio búzio) e
// --areia também é uma opção válida, ao contrário da paleta de fundo acima.
export const OPCOES_COR_PUBLICA = [
  { valor: "TINTA", rotulo: "Tinta", cor: "#201914" },
  { valor: "BARRO", rotulo: "Barro", cor: "#9C4A2F" },
  { valor: "OCRE", rotulo: "Ocre", cor: "#B87C34" },
  { valor: "BUZIO", rotulo: "Búzio", cor: "#EDB153" },
  { valor: "AREIA", rotulo: "Areia", cor: "#EDE4D4" },
  { valor: "PAPEL", rotulo: "Papel", cor: "#FAF6EE" },
  { valor: "CERRADO", rotulo: "Cerrado", cor: "#55603F" },
];

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
