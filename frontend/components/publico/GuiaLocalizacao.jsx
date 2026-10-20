"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { organizarGuia, rotuloLinkPonto, urlComoChegar } from "@/lib/localizacao";
import { dividirParagrafos } from "@/lib/publico";
import styles from "./GuiaLocalizacao.module.scss";

const MapaLocalizacao = dynamic(() => import("./MapaLocalizacao"), { ssr: false });

// Itens visíveis por subcategoria antes do "Ver mais" — mantém a lista
// curta (cerca de 3 por grupo em vez de dezenas).
const ITENS_POR_GRUPO = 3;

function chaveGrupo(tipoId, nomeGrupo) {
  return `${tipoId}|${nomeGrupo}`;
}

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
  // Subcategoria escolhida dentro da categoria ativa (null = todas).
  const [subcategoria, setSubcategoria] = useState(null);
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [gruposAbertos, setGruposAbertos] = useState(() => new Set());
  // Item a rolar até depois que o grupo dele abrir (marcador clicado).
  const [rolarPara, setRolarPara] = useState(null);

  const categorias = useMemo(() => organizarGuia(pontos), [pontos]);
  // Uma categoria por vez (sem "Todos", que era informação demais): abre na
  // primeira pela ordem dos tipos. Com uma categoria só, nem há filtros.
  const categoriaAtiva =
    categorias.find((categoria) => categoria.tipo.id === filtro)?.tipo.id ?? categorias[0]?.tipo.id;
  const categoriasVisiveis = categorias.filter((categoria) => categoria.tipo.id === categoriaAtiva);
  const gruposAtivos = categoriasVisiveis[0]?.grupos || [];
  // Abas de subcategoria só fazem sentido com duas ou mais e alguma nomeada.
  const temSubcategorias = gruposAtivos.length > 1 && gruposAtivos.some((grupo) => grupo.nome);
  const subcategoriaAtiva =
    temSubcategorias && gruposAtivos.some((grupo) => grupo.nome === subcategoria) ? subcategoria : null;

  const idsVisiveis = useMemo(
    () =>
      new Set(
        pontos
          .filter(
            (ponto) =>
              ponto.tipo.id === categoriaAtiva &&
              (subcategoriaAtiva === null || (ponto.grupo?.trim() || "") === subcategoriaAtiva)
          )
          .map((ponto) => ponto.id)
      ),
    [pontos, categoriaAtiva, subcategoriaAtiva]
  );

  useEffect(() => {
    if (!rolarPara) return;
    itensRef.current[rolarPara]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setRolarPara(null);
  }, [rolarPara]);

  function alternarGrupo(chave) {
    setGruposAbertos((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(chave)) proximo.delete(chave);
      else proximo.add(chave);
      return proximo;
    });
  }

  function escolherFiltro(tipoId) {
    setFiltro(tipoId);
    setSubcategoria(null);
    setSelecionadoId(null);
  }

  function escolherSubcategoria(nome) {
    setSubcategoria(nome);
    setSelecionadoId(null);
  }

  function verNoMapa(id) {
    setSelecionadoId(id);
    mapaRef.current?.focarPonto(id);
  }

  // Marcador clicado: destaca o item. Só rola a lista no desktop, onde o
  // mapa fica fixo ao lado — no celular a lista está abaixo do mapa e rolar
  // tiraria da tela o cartão que acabou de abrir.
  // Se o item estiver escondido no "Ver mais", o grupo dele abre antes.
  function aoSelecionarNoMapa(id) {
    setSelecionadoId(id);
    const ponto = pontos.find((item) => item.id === id);
    if (ponto) {
      const chave = chaveGrupo(ponto.tipo.id, ponto.grupo?.trim() || "");
      setGruposAbertos((atual) => (atual.has(chave) ? atual : new Set(atual).add(chave)));
    }
    if (window.matchMedia("(min-width: 1000px)").matches) setRolarPara(id);
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
        <div className={styles.filtros} role="group" aria-label="Escolher categoria">
          {categorias.map((categoria) => (
            <button
              key={categoria.tipo.id}
              type="button"
              className={styles.filtro}
              aria-pressed={categoriaAtiva === categoria.tipo.id}
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

                {temSubcategorias && (
                  <div className={styles.subcategorias} role="group" aria-label="Escolher subcategoria">
                    <button
                      type="button"
                      className={styles.subcategoria}
                      aria-pressed={subcategoriaAtiva === null}
                      onClick={() => escolherSubcategoria(null)}
                    >
                      Todas
                    </button>
                    {categoria.grupos.map((grupo) => (
                      <button
                        key={grupo.nome || "sem-grupo"}
                        type="button"
                        className={styles.subcategoria}
                        aria-pressed={subcategoriaAtiva === grupo.nome}
                        onClick={() => escolherSubcategoria(grupo.nome)}
                      >
                        {grupo.nome || "Outros"}
                        <span className={styles.filtroTotal}>{grupo.pontos.length}</span>
                      </button>
                    ))}
                  </div>
                )}

                {categoria.grupos
                  .filter((grupo) => subcategoriaAtiva === null || grupo.nome === subcategoriaAtiva)
                  .map((grupo) => {
                    const chave = chaveGrupo(categoria.tipo.id, grupo.nome);
                    // Com uma subcategoria escolhida a lista já é curta: mostra tudo.
                    const aberto = subcategoriaAtiva !== null || gruposAbertos.has(chave);
                    const escondidos = grupo.pontos.length - ITENS_POR_GRUPO;
                    const pontosExibidos = aberto ? grupo.pontos : grupo.pontos.slice(0, ITENS_POR_GRUPO);
                    const idLista = `localizacao-lista-${categoria.tipo.id}-${grupo.nome || "geral"}`
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, "-");

                    return (
                      <div key={grupo.nome || "sem-grupo"} className={styles.grupo}>
                        {grupo.nome && subcategoriaAtiva === null && (
                          <h4 className={styles.grupoTitulo}>{grupo.nome}</h4>
                        )}
                        <ul id={idLista} className={styles.lista}>
                          {pontosExibidos.map((ponto) => (
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
                        {escondidos > 0 && subcategoriaAtiva === null && (
                          <button
                            type="button"
                            className={styles.verMais}
                            aria-expanded={aberto}
                            aria-controls={idLista}
                            onClick={() => alternarGrupo(chave)}
                          >
                            {aberto
                              ? "Ver menos"
                              : `Ver mais ${escondidos === 1 ? "1 lugar" : `${escondidos} lugares`}`}
                          </button>
                        )}
                      </div>
                    );
                  })}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
