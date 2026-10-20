"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { organizarGuia, rotuloLinkPonto, urlComoChegar } from "@/lib/localizacao";
import { dividirParagrafos } from "@/lib/publico";
import styles from "./GuiaLocalizacao.module.scss";

const MapaLocalizacao = dynamic(() => import("./MapaLocalizacao"), { ssr: false });

function rotuloQuantidade(total) {
  return total === 1 ? "1 lugar" : `${total} lugares`;
}

// Guia da dobra Localização: filtros por categoria (tipo de ponto, com a cor
// do marcador como legenda), mapa e lista agrupada categoria → subcategoria.
// Lista e mapa andam juntos: "Ver no mapa" abre o ponto no mapa e clicar num
// marcador destaca o item na lista.
export default function GuiaLocalizacao({ pontos, introducao, textosTipos = {} }) {
  const mapaRef = useRef(null);
  const itensRef = useRef({});
  const [filtro, setFiltro] = useState(null);
  const [selecionadoId, setSelecionadoId] = useState(null);

  const categorias = useMemo(() => organizarGuia(pontos), [pontos]);
  const categoriasVisiveis = filtro
    ? categorias.filter((categoria) => categoria.tipo.id === filtro)
    : categorias;

  const idsVisiveis = useMemo(() => {
    if (!filtro) return null;
    return new Set(pontos.filter((ponto) => ponto.tipo.id === filtro).map((ponto) => ponto.id));
  }, [pontos, filtro]);

  function escolherFiltro(tipoId) {
    setFiltro(tipoId);
    setSelecionadoId(null);
  }

  function verNoMapa(id) {
    setSelecionadoId(id);
    mapaRef.current?.focarPonto(id);
  }

  // Marcador clicado: destaca o item. Só rola a lista no desktop, onde o
  // mapa fica fixo ao lado — no celular a lista está abaixo do mapa e rolar
  // tiraria da tela o cartão que acabou de abrir.
  function aoSelecionarNoMapa(id) {
    setSelecionadoId(id);
    if (window.matchMedia("(min-width: 1000px)").matches) {
      itensRef.current[id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  return (
    <div className={styles.guia}>
      {introducao &&
        dividirParagrafos(introducao).map((paragrafo, indice) => (
          <p key={indice} className={styles.introducao}>
            {paragrafo}
          </p>
        ))}

      {categorias.length > 1 && (
        <div className={styles.filtros} role="group" aria-label="Filtrar por categoria">
          <button
            type="button"
            className={styles.filtro}
            aria-pressed={filtro === null}
            onClick={() => escolherFiltro(null)}
          >
            Todos
            <span className={styles.filtroTotal}>{pontos.length}</span>
          </button>
          {categorias.map((categoria) => (
            <button
              key={categoria.tipo.id}
              type="button"
              className={styles.filtro}
              aria-pressed={filtro === categoria.tipo.id}
              onClick={() => escolherFiltro(categoria.tipo.id)}
            >
              <span
                className={styles.pontoCor}
                style={{ backgroundColor: categoria.tipo.cor }}
                aria-hidden="true"
              />
              {categoria.tipo.nome}
              <span className={styles.filtroTotal}>{categoria.total}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.colunaMapa}>
          <MapaLocalizacao
            ref={mapaRef}
            pontos={pontos}
            idsVisiveis={idsVisiveis}
            aoSelecionar={aoSelecionarNoMapa}
          />
        </div>

        <div className={styles.colunaLista}>
          {categoriasVisiveis.map((categoria) => {
            const idTitulo = `localizacao-categoria-${categoria.tipo.id}`;
            const texto = textosTipos[categoria.tipo.id];

            return (
              <section key={categoria.tipo.id} className={styles.categoria} aria-labelledby={idTitulo}>
                <header className={styles.categoriaCabecalho}>
                  <h3 id={idTitulo} className={styles.categoriaTitulo}>
                    <span
                      className={styles.pontoCor}
                      style={{ backgroundColor: categoria.tipo.cor }}
                      aria-hidden="true"
                    />
                    {categoria.tipo.nome}
                  </h3>
                  <span className={styles.categoriaTotal}>{rotuloQuantidade(categoria.total)}</span>
                </header>
                {dividirParagrafos(texto).map((paragrafo, indice) => (
                  <p key={indice} className={styles.categoriaTexto}>
                    {paragrafo}
                  </p>
                ))}

                {categoria.grupos.map((grupo) => (
                  <div key={grupo.nome || "sem-grupo"} className={styles.grupo}>
                    {grupo.nome && <h4 className={styles.grupoTitulo}>{grupo.nome}</h4>}
                    <ul className={styles.lista}>
                      {grupo.pontos.map((ponto) => (
                        <li
                          key={ponto.id}
                          ref={(elemento) => {
                            itensRef.current[ponto.id] = elemento;
                          }}
                          className={styles.item}
                          data-selecionado={selecionadoId === ponto.id || undefined}
                        >
                          {ponto.imagem && (
                            <img src={ponto.imagem} alt="" className={styles.itemImagem} loading="lazy" />
                          )}
                          <div className={styles.itemCorpo}>
                            <p className={styles.itemNome}>{ponto.nome}</p>
                            {ponto.descricao && <p className={styles.itemDescricao}>{ponto.descricao}</p>}
                            {ponto.endereco && <p className={styles.itemEndereco}>{ponto.endereco}</p>}
                            {ponto.aproximado && (
                              <p className={styles.itemAproximado}>
                                Localização aproximada no mapa
                              </p>
                            )}
                            <div className={styles.itemAcoes}>
                              <button
                                type="button"
                                className={styles.acao}
                                onClick={() => verNoMapa(ponto.id)}
                                aria-label={`Ver ${ponto.nome} no mapa`}
                              >
                                Ver no mapa
                              </button>
                              {ponto.link && (
                                <a
                                  href={ponto.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.acao}
                                  aria-label={`${rotuloLinkPonto(ponto.link)} de ${ponto.nome} (abre em nova aba)`}
                                >
                                  {rotuloLinkPonto(ponto.link)}
                                  <span aria-hidden="true"> ↗</span>
                                </a>
                              )}
                              <a
                                href={urlComoChegar(ponto)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.acao}
                                aria-label={`Como chegar a ${ponto.nome} (abre o Google Maps em nova aba)`}
                              >
                                Como chegar
                                <span aria-hidden="true"> ↗</span>
                              </a>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
