"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import Avatar from "./Avatar";
import CampoTexto from "./CampoTexto";
import CampoSelecao from "./CampoSelecao";
import CampoArea from "./CampoArea";
import CampoFoto from "@/components/forms/CampoFoto";
import styles from "./AtividadeForm.module.scss";

export default function PessoaEnvolvidaLinha({
  pessoa,
  indiceFlat,
  expandida,
  podeSubir,
  podeDescer,
  tiposParticipacao,
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
          <Avatar usuario={{ nome: pessoa.nome, foto: pessoa.imagem }} tamanho={32} />
          <span className={styles.textoResumo}>
            <span className={styles.nomeResumo}>{nomeExibicao}</span>
            {pessoa.breveDescricao && (
              <span className={styles.descricaoResumo}>{pessoa.breveDescricao}</span>
            )}
          </span>
        </button>
      </div>
      {expandida && (
        <div className={styles.corpoExpandido}>
          <CampoFoto
            id={`pessoa-imagem-${indiceFlat}`}
            rotulo="Foto"
            usuario={{ nome: pessoa.nome }}
            valor={pessoa.imagem}
            onChange={(imagem) => aoMudarCampo("imagem", imagem)}
            erro={erros[`pessoas.${indiceFlat}.imagem`]}
          />
          <CampoTexto
            id={`pessoa-nome-${indiceFlat}`}
            rotulo="Nome"
            value={pessoa.nome}
            onChange={(evento) => aoMudarCampo("nome", evento.target.value)}
            erro={erros[`pessoas.${indiceFlat}.nome`]}
          />
          <CampoSelecao
            id={`pessoa-tipo-participacao-${indiceFlat}`}
            rotulo="Tipo de participação (opcional)"
            value={pessoa.tipoParticipacaoId}
            onChange={(evento) => aoMudarCampo("tipoParticipacaoId", evento.target.value)}
            erro={erros[`pessoas.${indiceFlat}.tipoParticipacaoId`]}
          >
            <option value="">Nenhum</option>
            {tiposParticipacao.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </CampoSelecao>
          <CampoTexto
            id={`pessoa-breve-descricao-${indiceFlat}`}
            rotulo="Breve descrição"
            value={pessoa.breveDescricao}
            onChange={(evento) => aoMudarCampo("breveDescricao", evento.target.value)}
            erro={erros[`pessoas.${indiceFlat}.breveDescricao`]}
          />
          <CampoArea
            id={`pessoa-descricao-${indiceFlat}`}
            rotulo="Descrição"
            linhas={3}
            value={pessoa.descricao}
            onChange={(evento) => aoMudarCampo("descricao", evento.target.value)}
            erro={erros[`pessoas.${indiceFlat}.descricao`]}
          />
          <button type="button" className={styles.botaoRemoverPessoa} onClick={aoRemover} aria-label="Remover pessoa">
            <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
            Remover pessoa
          </button>
        </div>
      )}
    </div>
  );
}
