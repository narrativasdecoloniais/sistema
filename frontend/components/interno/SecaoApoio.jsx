import { HandHeart, Trash2 } from "lucide-react";
import { Button } from "primereact/button";
import CampoTexto from "./CampoTexto";
import CampoLogo from "./CampoLogo";
import CampoCorSecao from "./CampoCorSecao";
import CampoOpacidade from "./CampoOpacidade";
import CampoCheckbox from "./CampoCheckbox";
import CabecalhoSecao from "./CabecalhoSecao";
import styles from "./EdicaoForm.module.scss";

export default function SecaoApoio({
  apoiadores,
  corFundo,
  opacidade,
  mostrarFaixa,
  erros,
  aoMudarApoiador,
  aoMudarCorFundo,
  aoMudarOpacidade,
  aoMudarMostrarFaixa,
  aoSalvar,
  aoAdicionarApoiador,
  aoRemoverApoiador,
}) {
  return (
    <div className={styles.secao}>
      <CabecalhoSecao
        Icone={HandHeart}
        titulo="Apoio"
        descricao="Logos das instituições e grupos que apoiam esta edição, com link opcional para o site de cada um."
      />
      <div className={styles.camposSecao}>
        <CampoCorSecao
          id="corFundoApoiadores"
          rotulo="Cor de fundo da seção"
          valor={corFundo}
          onChange={aoMudarCorFundo}
        />
        <CampoOpacidade
          id="opacidadeFundoApoiadores"
          rotulo="Opacidade do fundo"
          valor={opacidade}
          onChange={aoMudarOpacidade}
        />
        <CampoCheckbox
          id="mostrarFaixaApoiadores"
          rotulo="Mostrar a faixa lateral (definida no Hero) enquanto esta seção está em tela"
          checked={mostrarFaixa}
          onChange={aoMudarMostrarFaixa}
        />
        <div className={styles.listaCartoes}>
          {apoiadores.map((apoiador, indice) => (
            <div key={apoiador.id || indice} className={styles.cartaoRealizador}>
              <CampoLogo
                id={`apoiador-imagem-${indice}`}
                rotulo="Logo"
                valor={apoiador.imagem}
                onChange={(imagem) => aoMudarApoiador(indice, "imagem", imagem)}
                erro={erros[`apoiadores.${indice}.imagem`]}
                permiteRemover={false}
              />
              <CampoTexto
                id={`apoiador-nome-${indice}`}
                rotulo="Nome"
                value={apoiador.nome}
                onChange={(evento) => aoMudarApoiador(indice, "nome", evento.target.value)}
                onBlur={aoSalvar}
                erro={erros[`apoiadores.${indice}.nome`]}
              />
              <CampoTexto
                id={`apoiador-link-${indice}`}
                rotulo="Link (opcional)"
                value={apoiador.link}
                onChange={(evento) => aoMudarApoiador(indice, "link", evento.target.value)}
                onBlur={aoSalvar}
                erro={erros[`apoiadores.${indice}.link`]}
              />
              <button
                type="button"
                className={styles.botaoRemoverRealizador}
                onClick={() => aoRemoverApoiador(indice)}
                aria-label="Remover apoiador"
              >
                <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                Remover apoiador
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          label="Adicionar apoiador"
          onClick={aoAdicionarApoiador}
          pt={{ root: { className: styles.botaoSecundario } }}
        />
      </div>
    </div>
  );
}
