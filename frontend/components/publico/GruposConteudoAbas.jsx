"use client";

import { useId, useRef, useState } from "react";
import styles from "./GruposConteudoAbas.module.scss";

function idAba(base, chave) {
  return `${base}-aba-${chave}`;
}

function idPainel(base, chave) {
  return `${base}-painel-${chave}`;
}

function ItemConteudo({ item }) {
  const conteudo = (
    <>
      {item.imagem && (
        <img src={item.imagem} alt="" className={styles.itemLogo} />
      )}
      <span>{item.nome}</span>
    </>
  );

  return item.link ? (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.itemLink}
    >
      {conteudo}
    </a>
  ) : (
    <span className={styles.itemLinha}>{conteudo}</span>
  );
}

// Uma aba por GrupoConteudo; dentro da aba ativa, cada ListaConteudo vira um
// item de acordeão (só uma lista aberta por vez) que revela os ItemConteudo
// inline — substitui o antigo grid de cards + ModalListaConteudo.
export default function GruposConteudoAbas({ grupos }) {
  const idBase = useId();
  const [grupoAtivoId, setGrupoAtivoId] = useState(grupos[0]?.id ?? null);
  const [listaAbertaId, setListaAbertaId] = useState(null);
  const refsAbas = useRef([]);

  function selecionarGrupo(id) {
    setGrupoAtivoId(id);
    setListaAbertaId(null);
  }

  function aoTeclar(evento, index) {
    const mapa = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: grupos.length - 1,
    };
    const alvo = mapa[evento.key];
    if (alvo === undefined) return;

    evento.preventDefault();
    const proximo = (alvo + grupos.length) % grupos.length;
    selecionarGrupo(grupos[proximo].id);
    refsAbas.current[proximo]?.focus();
  }

  const grupoAtivo =
    grupos.find((grupo) => grupo.id === grupoAtivoId) ?? grupos[0];

  if (!grupoAtivo) return null;

  return (
    <div className={styles.bloco}>
      <div
        className={styles.abas}
        role="tablist"
        aria-label="Comissões e programas"
      >
        {grupos.map((grupo, index) => {
          const ativo = grupo.id === grupoAtivo.id;

          return (
            <button
              key={grupo.id}
              ref={(no) => (refsAbas.current[index] = no)}
              type="button"
              role="tab"
              id={idAba(idBase, grupo.id)}
              aria-controls={idPainel(idBase, grupo.id)}
              aria-selected={ativo}
              tabIndex={ativo ? 0 : -1}
              className={`${styles.aba} ${ativo ? styles.abaAtiva : ""}`}
              onClick={() => selecionarGrupo(grupo.id)}
              onKeyDown={(evento) => aoTeclar(evento, index)}
            >
              {grupo.nome}
            </button>
          );
        })}
      </div>

      <div
        className={styles.painel}
        role="tabpanel"
        id={idPainel(idBase, grupoAtivo.id)}
        aria-labelledby={idAba(idBase, grupoAtivo.id)}
      >
        <ul className={styles.listasAcordeao}>
          {grupoAtivo.listas.map((lista) => {
            const aberta = lista.id === listaAbertaId;
            const idBotao = idAba(idBase, `lista-${lista.id}`);
            const idConteudo = idPainel(idBase, `lista-${lista.id}`);

            return (
              <li key={lista.id} className={styles.listaItem}>
                <button
                  type="button"
                  id={idBotao}
                  className={styles.listaCabecalho}
                  aria-expanded={aberta}
                  aria-controls={idConteudo}
                  onClick={() => setListaAbertaId(aberta ? null : lista.id)}
                >
                  <span className={styles.listaTitulo}>{lista.nome}</span>
                  <span className={styles.listaSeta} aria-hidden="true">
                    {aberta ? "−" : "+"}
                  </span>
                </button>

                {aberta && (
                  <ul
                    id={idConteudo}
                    className={styles.itensLista}
                    role="region"
                    aria-labelledby={idBotao}
                  >
                    {lista.itens.map((item) => (
                      <li key={item.id} className={styles.itensListaItem}>
                        <ItemConteudo item={item} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
