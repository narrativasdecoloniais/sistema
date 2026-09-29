import Campo from "./Campo";
import CampoCPF from "./CampoCPF";
import CampoSelect from "./CampoSelect";
import { PAISES } from "@/lib/identificacao";
import styles from "./CampoIdentificacao.module.scss";

// CPF (padrão) ou, para estrangeiros sem CPF, país + número do documento do
// próprio país. valor = { tipoDocumento, cpf, documento, pais } (ver
// IDENTIFICACAO_INICIAL em lib/identificacao.js); erros usa as chaves
// cpf/documento/pais, as mesmas do backend.
export default function CampoIdentificacao({ id, valor, onChange, erros = {}, variante, rotuloCpf = "CPF" }) {
  const estrangeiro = valor.tipoDocumento === "ESTRANGEIRO";

  function atualizar(campo, novo) {
    onChange({ ...valor, [campo]: novo });
  }

  return (
    <div className={styles.grupo}>
      <div className={styles.abas} role="tablist" aria-label="Tipo de identificação">
        <button
          type="button"
          role="tab"
          aria-selected={!estrangeiro}
          className={`${styles.aba} ${!estrangeiro ? styles.abaAtiva : ""}`}
          onClick={() => atualizar("tipoDocumento", "CPF")}
        >
          Tenho CPF
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={estrangeiro}
          className={`${styles.aba} ${estrangeiro ? styles.abaAtiva : ""}`}
          onClick={() => atualizar("tipoDocumento", "ESTRANGEIRO")}
        >
          Sou estrangeiro(a)
        </button>
      </div>

      {estrangeiro ? (
        <>
          <CampoSelect
            id={`${id}-pais`}
            rotulo="País"
            variante={variante}
            value={valor.pais}
            onChange={(evento) => atualizar("pais", evento.target.value)}
            erro={erros.pais}
          >
            <option value="">Selecione o país</option>
            {PAISES.map((pais) => (
              <option key={pais.codigo} value={pais.codigo}>
                {pais.nome}
              </option>
            ))}
          </CampoSelect>
          <Campo
            id={`${id}-documento`}
            rotulo="Número do documento de identificação do seu país"
            variante={variante}
            autoComplete="off"
            value={valor.documento}
            onChange={(evento) => atualizar("documento", evento.target.value)}
            erro={erros.documento}
          />
        </>
      ) : (
        <CampoCPF
          id={`${id}-cpf`}
          rotulo={rotuloCpf}
          variante={variante}
          value={valor.cpf}
          onChange={(evento) => atualizar("cpf", evento.target.value)}
          erro={erros.cpf}
        />
      )}
    </div>
  );
}
