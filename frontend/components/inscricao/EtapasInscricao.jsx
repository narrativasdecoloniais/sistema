"use client";

import { Stepper } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel";
import styles from "./EtapasInscricao.module.scss";

function classesCondicionais(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Stepper vertical de verdade: o conteúdo de cada etapa (passado como
// `children`) nasce dentro do painel ativo, logo abaixo do próprio
// cabeçalho — o PrimeReact só monta/renderiza o painel cujo índice bate com
// `activeStep` (ver createPanelContent em primereact/stepper), então basta
// repassar `children` pra todos os StepperPanel; só o ativo chega a
// aparecer. A navegação por clique no cabeçalho continua desativada
// (pt.action): quem decide a etapa ativa é o estado do fluxo na página.
export default function EtapasInscricao({ passos, passoAtualIndex, children }) {
  return (
    <div className={styles.wrapper}>
      <svg className={styles.buzio} aria-hidden="true" width="18" height="18">
        <use href="#buzio-simbolo-1" width="100%" height="100%" />
      </svg>

      <Stepper
        activeStep={passoAtualIndex}
        orientation="vertical"
        unstyled
        pt={{
          root: { className: styles.root },
          stepperpanel: {
            root: { className: styles.conteudoEtapa },
            panel: { className: styles.item },
            header: { className: styles.header },
            action: { className: styles.action },
            number: (options) => ({
              className: classesCondicionais(
                styles.numero,
                options.context.active && styles.numeroAtivo,
                options.context.highlighted && styles.numeroConcluido
              ),
            }),
            title: (options) => ({
              className: classesCondicionais(
                styles.titulo,
                options.context.active && styles.tituloAtivo,
                options.context.highlighted && styles.tituloConcluido
              ),
            }),
            separator: { className: styles.separadorOculto },
          },
        }}
      >
        {passos.map((rotulo, index) => (
          <StepperPanel key={rotulo} header={rotulo}>
            {index === passoAtualIndex ? children : null}
          </StepperPanel>
        ))}
      </Stepper>
    </div>
  );
}
