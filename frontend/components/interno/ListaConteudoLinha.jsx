"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import CampoTexto from "./CampoTexto";
import { Button } from "primereact/button";
import ItemConteudoLinha from "./ItemConteudoLinha";
import styles from "./AtividadeForm.module.scss";

// Erros vêm do form pai com caminho pontilhado completo (ex.
// "listas.2.itens.0.nome") — recorta pro prefixo desta lista antes de
// repassar pros componentes filhos, que só conhecem o próprio campo.
function escoparErros(erros, prefixo) {
  const escopado = {};
  for (const [chave, valor] of Object.entries(erros)) {
    if (chave.startsWith(prefixo)) escopado[chave.slice(prefixo.length)] = valor;
  }
  return escopado;
}

export default function ListaConteudoLinha({
  lista,
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
  const [itemExpandidoId, setItemExpandidoId] = useState(null);

  const prefixo = `listas.${indiceFlat}.`;
  const errosLista = escoparErros(erros, prefixo);
  const errosItens = escoparErros(errosLista, "itens.");
  const itens = lista.itens || [];
  const nomeExibicao = lista.nome || "Nova lista";

  function aoMudarItem(indice, campo, valor) {
    const novosItens = [...itens];
    novosItens[indice] = { ...novosItens[indice], [campo]: valor };
    aoMudarCampo("itens", novosItens);
  }

  function aoAdicionarItem() {
    const localId = crypto.randomUUID();
    aoMudarCampo("itens", [...itens, { localId, nome: "", imagem: null, link: "" }]);
    setItemExpandidoId(localId);
  }

  function aoRemoverItem(indice) {
    const localId = itens[indice]?.localId;
    aoMudarCampo("itens", itens.filter((_, i) => i !== indice));
    setItemExpandidoId((atual) => (atual === localId ? null : atual));
  }

  function aoAlternarExpandirItem(localId) {
    setItemExpandidoId((atual) => (atual === localId ? null : localId));
  }

  function moverItem(localId, direcao) {
    const indiceAtual = itens.findIndex((item) => item.localId === localId);
    if (indiceAtual === -1) return;

    const indiceAlvo = indiceAtual + direcao;
    if (indiceAlvo < 0 || indiceAlvo >= itens.length) return;

    const novosItens = [...itens];
    [novosItens[indiceAtual], novosItens[indiceAlvo]] = [novosItens[indiceAlvo], novosItens[indiceAtual]];
    aoMudarCampo("itens", novosItens);
  }

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
          <span className={styles.textoResumo}>
            <span className={styles.nomeResumo}>{nomeExibicao}</span>
            <span className={styles.descricaoResumo}>
              {itens.length} {itens.length === 1 ? "item" : "itens"}
            </span>
          </span>
        </button>
      </div>
      {expandida && (
        <div className={styles.corpoExpandido}>
          <CampoTexto
            id={`lista-nome-${indiceFlat}`}
            rotulo="Nome"
            value={lista.nome}
            onChange={(evento) => aoMudarCampo("nome", evento.target.value)}
            erro={errosLista.nome}
          />

          <div className={styles.secaoPessoas}>
            <span className={styles.rotuloLista}>Itens</span>
            {itens.map((item, indice) => (
              <ItemConteudoLinha
                key={item.localId}
                item={item}
                indiceFlat={indice}
                expandida={itemExpandidoId === item.localId}
                podeSubir={indice > 0}
                podeDescer={indice < itens.length - 1}
                erros={escoparErros(errosItens, `${indice}.`)}
                aoAlternarExpandir={() => aoAlternarExpandirItem(item.localId)}
                aoMudarCampo={(campo, valor) => aoMudarItem(indice, campo, valor)}
                aoMover={(direcao) => moverItem(item.localId, direcao)}
                aoRemover={() => aoRemoverItem(indice)}
              />
            ))}
            <Button
              type="button"
              label="Adicionar item"
              onClick={aoAdicionarItem}
              pt={{ root: { className: styles.botaoSecundario } }}
            />
          </div>

          <button
            type="button"
            className={styles.botaoRemoverPessoa}
            onClick={aoRemover}
            aria-label="Remover lista"
          >
            <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
            Remover lista
          </button>
        </div>
      )}
    </div>
  );
}
