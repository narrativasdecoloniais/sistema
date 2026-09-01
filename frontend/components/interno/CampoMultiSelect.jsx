"use client";

import { MultiSelect } from "primereact/multiselect";
import { Search, ChevronDown, X } from "lucide-react";
import styles from "./CampoMultiSelect.module.scss";

// Multiselect pesquisável — PrimeReact em modo unstyled, estilizado via pt
// pros tokens do DESIGN.md, no mesmo molde de Campo/CampoSelecao/CampoCheckbox.
export default function CampoMultiSelect({
  id,
  rotulo,
  erro,
  value,
  onChange,
  options,
  optionLabel = "nome",
  optionValue = "id",
  itemTemplate,
  placeholder = "Selecionar...",
  filterPlaceholder = "Buscar...",
  vazio = "Nenhuma opção disponível.",
  vazioFiltro = "Nenhum resultado encontrado.",
  ...props
}) {
  return (
    <div className={styles.grupo}>
      {rotulo && (
        <label htmlFor={id} className={styles.rotulo}>
          {rotulo}
        </label>
      )}
      <MultiSelect
        inputId={id}
        value={value}
        onChange={(evento) => onChange(evento.value)}
        options={options}
        optionLabel={optionLabel}
        optionValue={optionValue}
        display="chip"
        filter
        showSelectAll={false}
        filterPlaceholder={filterPlaceholder}
        emptyFilterMessage={vazioFiltro}
        emptyMessage={vazio}
        placeholder={placeholder}
        filterIcon={<Search size={15} strokeWidth={1.5} aria-hidden="true" />}
        dropdownIcon={<ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />}
        removeIcon={<X size={13} strokeWidth={1.5} aria-hidden="true" />}
        closeIcon={<X size={15} strokeWidth={1.5} aria-hidden="true" />}
        itemTemplate={itemTemplate}
        unstyled
        pt={{
          root: { className: `${styles.raiz} ${erro ? styles.invalido : ""}` },
          labelContainer: { className: styles.rotuloContainer },
          label: { className: styles.marcadorTexto },
          token: { className: styles.token },
          tokenLabel: { className: styles.tokenRotulo },
          removeTokenIcon: { className: styles.removerToken },
          trigger: { className: styles.gatilho },
          panel: { className: styles.painel },
          header: { className: styles.cabecalhoPainel },
          filterContainer: { className: styles.containerFiltro },
          filterInput: { root: { className: styles.entradaFiltro } },
          filterIcon: { className: styles.iconeFiltro },
          closeButton: { className: styles.botaoFechar },
          wrapper: { className: styles.wrapperLista },
          list: { className: styles.lista },
          item: { className: styles.item },
          checkboxContainer: { className: styles.checkboxContainer },
          checkbox: {
            root: { className: styles.raizCheckbox },
            input: { className: styles.inputOculto },
            box: { className: styles.caixaCheckbox },
            icon: { className: styles.iconeCheck },
          },
          emptyMessage: { className: styles.mensagemVazia },
        }}
        {...props}
      />
      {erro && <p className={styles.mensagemErro}>{erro}</p>}
    </div>
  );
}
