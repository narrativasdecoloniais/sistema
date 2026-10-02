"use client";

import { useState } from "react";
import { AutoComplete } from "primereact/autocomplete";
import { ChevronDown } from "lucide-react";
import styles from "./CampoSugestoes.module.scss";

function semAcento(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Texto livre com uma lista de sugestões (botão de seta mostra todas; ao
// digitar, filtra). O valor é sempre o texto digitado ou a sugestão escolhida.
// PrimeReact AutoComplete em modo unstyled, estilizado via pt.
export default function CampoSugestoes({ id, rotulo, erro, value, onChange, sugestoes, ...props }) {
  const [filtradas, setFiltradas] = useState(sugestoes);
  const idErro = `${id}-erro`;

  function filtrar(evento) {
    const busca = semAcento(evento.query.trim());
    // Sempre um array novo: o AutoComplete só abre o painel (e sai do estado
    // "buscando") quando a prop suggestions muda de referência — devolver a
    // mesma lista ao clicar na seta deixava o spinner girando sem abrir nada.
    setFiltradas(busca ? sugestoes.filter((sugestao) => semAcento(sugestao).includes(busca)) : [...sugestoes]);
  }

  return (
    <div className={styles.grupo}>
      <label htmlFor={id} className={styles.rotulo}>
        {rotulo}
      </label>
      <AutoComplete
        inputId={id}
        value={value}
        suggestions={filtradas}
        completeMethod={filtrar}
        onChange={(evento) => onChange(evento.value ?? "")}
        dropdown
        dropdownAriaLabel="Mostrar sugestões"
        dropdownIcon={<ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />}
        aria-invalid={erro ? "true" : undefined}
        aria-describedby={erro ? idErro : undefined}
        unstyled
        pt={{
          root: { className: `${styles.raiz} ${erro ? styles.invalido : ""}` },
          input: { root: { className: styles.entrada } },
          // Filtro é síncrono; o spinner só piscaria sem estilo.
          loadingIcon: { className: styles.oculto },
          dropdownButton: { root: { className: styles.botaoSeta } },
          panel: { className: styles.painel },
          list: { className: styles.lista },
          item: { className: styles.item },
        }}
        {...props}
      />
      {erro && (
        <p id={idErro} className={styles.mensagemErro}>
          {erro}
        </p>
      )}
    </div>
  );
}
