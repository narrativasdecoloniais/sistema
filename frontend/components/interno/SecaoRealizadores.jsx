import { Building2, Trash2 } from "lucide-react";
import { Button } from "primereact/button";
import CampoTexto from "./CampoTexto";
import CampoLogo from "./CampoLogo";
import CampoCorSecao from "./CampoCorSecao";
import CabecalhoSecao from "./CabecalhoSecao";
import styles from "./EdicaoForm.module.scss";

export default function SecaoRealizadores({
  realizadores,
  corFundo,
  erros,
  aoMudarRealizador,
  aoMudarCorFundo,
  aoSalvar,
  aoAdicionarRealizador,
  aoRemoverRealizador,
}) {
  return (
    <div className={styles.secao}>
      <CabecalhoSecao
        Icone={Building2}
        titulo="Realizadores"
        descricao="Logos das instituições e grupos que realizam esta edição, com link opcional para o site de cada um."
      />
      <div className={styles.camposSecao}>
        <CampoCorSecao
          id="corFundoRealizadores"
          rotulo="Cor de fundo da seção"
          valor={corFundo}
          onChange={aoMudarCorFundo}
        />
        <div className={styles.listaCartoes}>
          {realizadores.map((realizador, indice) => (
            <div key={realizador.id || indice} className={styles.cartaoRealizador}>
              <CampoLogo
                id={`realizador-imagem-${indice}`}
                rotulo="Logo"
                valor={realizador.imagem}
                onChange={(imagem) => aoMudarRealizador(indice, "imagem", imagem)}
                erro={erros[`realizadores.${indice}.imagem`]}
                permiteRemover={false}
              />
              <CampoTexto
                id={`realizador-nome-${indice}`}
                rotulo="Nome"
                value={realizador.nome}
                onChange={(evento) => aoMudarRealizador(indice, "nome", evento.target.value)}
                onBlur={aoSalvar}
                erro={erros[`realizadores.${indice}.nome`]}
              />
              <CampoTexto
                id={`realizador-link-${indice}`}
                rotulo="Link (opcional)"
                value={realizador.link}
                onChange={(evento) => aoMudarRealizador(indice, "link", evento.target.value)}
                onBlur={aoSalvar}
                erro={erros[`realizadores.${indice}.link`]}
              />
              <button
                type="button"
                className={styles.botaoRemoverRealizador}
                onClick={() => aoRemoverRealizador(indice)}
                aria-label="Remover realizador"
              >
                <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                Remover realizador
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          label="Adicionar realizador"
          onClick={aoAdicionarRealizador}
          pt={{ root: { className: styles.botaoSecundario } }}
        />
      </div>
    </div>
  );
}
