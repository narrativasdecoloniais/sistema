"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import Avatar from "./Avatar";
import CampoTexto from "./CampoTexto";
import CampoFoto from "@/components/forms/CampoFoto";
import styles from "./AtividadeForm.module.scss";

// Mesmo shell de expandir/colapsar/reordenar de PessoaAreaLinha.jsx — o item
// aqui tem nome + imagem/link opcionais (cobre tanto um integrante de
// comissão, que só preenche o nome, quanto um programa, que preenche todos).
export default function ItemConteudoLinha({
  item,
  indiceFlat,
  expandida,
  podeSubir,
  podeDescer,
  erros,
  aoAlternarExpandir,
  aoMudarCampo,
  aoMover,
  aoRemover,
}) {
  const nomeExibicao = item.nome || "Novo item";

  return (
    <div className={styles.linhaPessoa}>
      <div className={styles.cabecalhoPessoa}>
        <div className={styles.controlesReordenar}>
          <button
            type="button"
            className={styles.botaoReordenar}
            onClick={() => aoMover(-1)}
            disabled={!podeSubir}
            aria-label={`Mover ${nomeExibicao} para cima`}
          >
            <ChevronUp size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.botaoReordenar}
            onClick={() => aoMover(1)}
            disabled={!podeDescer}
            aria-label={`Mover ${nomeExibicao} para baixo`}
          >
            <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          className={styles.resumoPessoa}
          onClick={aoAlternarExpandir}
          aria-expanded={expandida}
        >
          <Avatar usuario={{ nome: item.nome }} tamanho={32} />
          <span className={styles.textoResumo}>
            <span className={styles.nomeResumo}>{nomeExibicao}</span>
          </span>
        </button>
      </div>
      {expandida && (
        <div className={styles.corpoExpandido}>
          <CampoFoto
            id={`item-imagem-${indiceFlat}`}
            rotulo="Imagem (opcional)"
            usuario={{ nome: item.nome }}
            valor={item.imagem}
            onChange={(imagem) => aoMudarCampo("imagem", imagem)}
            erro={erros.imagem}
          />
          <CampoTexto
            id={`item-nome-${indiceFlat}`}
            rotulo="Nome"
            value={item.nome}
            onChange={(evento) => aoMudarCampo("nome", evento.target.value)}
            erro={erros.nome}
          />
          <CampoTexto
            id={`item-link-${indiceFlat}`}
            rotulo="Link (opcional)"
            value={item.link}
            onChange={(evento) => aoMudarCampo("link", evento.target.value)}
            erro={erros.link}
          />
          <button
            type="button"
            className={styles.botaoRemoverPessoa}
            onClick={aoRemover}
            aria-label="Remover item"
          >
            <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
            Remover item
          </button>
        </div>
      )}
    </div>
  );
}
