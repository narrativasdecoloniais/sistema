"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import Avatar from "./Avatar";
import CampoTexto from "./CampoTexto";
import CampoSelecao from "./CampoSelecao";
import styles from "./AtividadeForm.module.scss";

// Mesmo shell de expandir/colapsar/reordenar de PessoaEnvolvidaLinha.jsx —
// mas sem foto/breve descrição/descrição (a pessoa aqui só tem nome,
// afiliação e papel), então é um componente próprio em vez de generalizar
// os dois num só.
export default function PessoaAreaLinha({
  pessoa,
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
  const nomeExibicao = pessoa.nome || "Nova pessoa";

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
          <Avatar usuario={{ nome: pessoa.nome }} tamanho={32} />
          <span className={styles.textoResumo}>
            <span className={styles.nomeResumo}>{nomeExibicao}</span>
            {pessoa.afiliacao && (
              <span className={styles.descricaoResumo}>{pessoa.afiliacao}</span>
            )}
          </span>
        </button>
      </div>
      {expandida && (
        <div className={styles.corpoExpandido}>
          <CampoTexto
            id={`pessoa-area-nome-${indiceFlat}`}
            rotulo="Nome"
            value={pessoa.nome}
            onChange={(evento) => aoMudarCampo("nome", evento.target.value)}
            erro={erros.nome}
          />
          <CampoTexto
            id={`pessoa-area-afiliacao-${indiceFlat}`}
            rotulo="Afiliação (opcional)"
            value={pessoa.afiliacao}
            onChange={(evento) => aoMudarCampo("afiliacao", evento.target.value)}
            erro={erros.afiliacao}
          />
          <CampoSelecao
            id={`pessoa-area-papel-${indiceFlat}`}
            rotulo="Papel"
            value={pessoa.papel}
            onChange={(evento) => aoMudarCampo("papel", evento.target.value)}
            erro={erros.papel}
          >
            <option value="COORDENACAO">Coordenação</option>
            <option value="CONVIDADO">Convidado(a) especial</option>
          </CampoSelecao>
          <button
            type="button"
            className={styles.botaoRemoverPessoa}
            onClick={aoRemover}
            aria-label="Remover pessoa"
          >
            <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
            Remover pessoa
          </button>
        </div>
      )}
    </div>
  );
}
