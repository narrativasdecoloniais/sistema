"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { normalizarBusca, recortarTexto, rotuloPaginas } from "@/lib/anais";
import styles from "./AnaisEdicao.module.scss";

// Lista pública dos trabalhos dos Anais, com busca (título, autores e trecho
// do resumo, sem acento), filtros em cascata modalidade → área, filtro por
// autor (clicando no nome) e ordenação. O estado fica na URL (?q=&modalidade=
// &area=&autor=&ordem=) pra dar pra compartilhar uma busca.

const ORDENS = [
  { valor: "anais", rotulo: "Ordem dos Anais" },
  { valor: "titulo", rotulo: "Título (A–Z)" },
];

function opcoesUnicas(lista, chave) {
  const mapa = new Map();
  for (const item of lista) {
    const valor = item[chave];
    if (valor && !mapa.has(valor.id)) mapa.set(valor.id, valor);
  }
  return [...mapa.values()].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

function agrupar(artigos) {
  const grupos = [];
  for (const artigo of artigos) {
    let modalidade = grupos[grupos.length - 1];
    if (!modalidade || modalidade.id !== artigo.modalidade.id) {
      modalidade = { id: artigo.modalidade.id, nome: artigo.modalidade.nome, areas: [] };
      grupos.push(modalidade);
    }
    let area = modalidade.areas[modalidade.areas.length - 1];
    const areaId = artigo.area?.id || "sem-area";
    if (!area || area.id !== areaId) {
      area = { id: areaId, titulo: artigo.area?.titulo || null, artigos: [] };
      modalidade.areas.push(area);
    }
    area.artigos.push(artigo);
  }
  return grupos;
}

// Sem agrupamento (ordem por título) o título do cartão sobe um nível, pra
// não pular de h2 para h4.
function CartaoArtigo({ artigo, edicaoSlug, aoFiltrarAutor, agrupado = true }) {
  const paginas = rotuloPaginas(artigo.paginaInicial, artigo.paginaFinal);
  const Titulo = agrupado ? "h4" : "h3";
  return (
    <li className={styles.cartao}>
      <Titulo className={styles.cartaoTitulo}>
        <Link href={`/anais/${edicaoSlug}/${artigo.slug}`}>{artigo.titulo}</Link>
      </Titulo>
      <p className={styles.cartaoAutores}>
        {artigo.autores.map((autor, indice) => (
          <span key={`${autor.nome}-${indice}`}>
            {indice > 0 && "; "}
            <button
              type="button"
              className={styles.autor}
              onClick={() => aoFiltrarAutor(autor.nome)}
              title={`Ver trabalhos de ${autor.nome}`}
            >
              {autor.nome}
            </button>
          </span>
        ))}
      </p>
      {artigo.trecho && <p className={styles.cartaoTrecho}>{recortarTexto(artigo.trecho, 240)}</p>}
      <p className={styles.cartaoRodape}>
        {[artigo.modalidade?.nome, artigo.area?.titulo, paginas].filter(Boolean).join(" · ")}
      </p>
    </li>
  );
}

export default function AnaisEdicao({ artigos, edicaoSlug }) {
  const router = useRouter();
  const pathname = usePathname();
  const parametros = useSearchParams();

  const [busca, setBusca] = useState(parametros.get("q") || "");
  const [modalidadeId, setModalidadeId] = useState(parametros.get("modalidade") || "");
  const [areaId, setAreaId] = useState(parametros.get("area") || "");
  const [autor, setAutor] = useState(parametros.get("autor") || "");
  const [ordem, setOrdem] = useState(parametros.get("ordem") === "titulo" ? "titulo" : "anais");
  const topoRef = useRef(null);

  // Reflete os filtros na URL (sem recarregar nem rolar a página); a busca
  // espera a pessoa parar de digitar.
  useEffect(() => {
    const temporizador = setTimeout(() => {
      const novos = new URLSearchParams();
      if (busca.trim()) novos.set("q", busca.trim());
      if (modalidadeId) novos.set("modalidade", modalidadeId);
      if (areaId) novos.set("area", areaId);
      if (autor) novos.set("autor", autor);
      if (ordem !== "anais") novos.set("ordem", ordem);
      const consulta = novos.toString();
      router.replace(consulta ? `${pathname}?${consulta}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(temporizador);
  }, [busca, modalidadeId, areaId, autor, ordem, pathname, router]);

  const modalidades = useMemo(() => opcoesUnicas(artigos, "modalidade"), [artigos]);
  const areas = useMemo(
    () => opcoesUnicas(modalidadeId ? artigos.filter((artigo) => artigo.modalidade.id === modalidadeId) : artigos, "area"),
    [artigos, modalidadeId]
  );

  // Índice de busca calculado uma vez.
  const indexados = useMemo(
    () =>
      artigos.map((artigo) => ({
        artigo,
        texto: normalizarBusca(`${artigo.titulo} ${artigo.autores.map((a) => a.nome).join(" ")} ${artigo.trecho || ""}`),
        autores: artigo.autores.map((a) => normalizarBusca(a.nome)),
      })),
    [artigos]
  );

  const filtrados = useMemo(() => {
    const termos = normalizarBusca(busca).split(/\s+/).filter(Boolean);
    const autorNormalizado = normalizarBusca(autor);
    const lista = indexados
      .filter(({ artigo, texto, autores }) => {
        if (modalidadeId && artigo.modalidade.id !== modalidadeId) return false;
        if (areaId && artigo.area?.id !== areaId) return false;
        if (autorNormalizado && !autores.includes(autorNormalizado)) return false;
        return termos.every((termo) => texto.includes(termo));
      })
      .map(({ artigo }) => artigo);
    if (ordem === "titulo") {
      return [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR", { sensitivity: "base" }));
    }
    return lista;
  }, [indexados, busca, modalidadeId, areaId, autor, ordem]);

  const grupos = useMemo(() => (ordem === "anais" ? agrupar(filtrados) : null), [filtrados, ordem]);
  const temFiltro = Boolean(busca.trim() || modalidadeId || areaId || autor);

  function limpar() {
    setBusca("");
    setModalidadeId("");
    setAreaId("");
    setAutor("");
  }

  function filtrarAutor(nome) {
    setAutor(nome);
    topoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (artigos.length === 0) {
    return <p className={styles.vazio}>Nenhum trabalho publicado nestes Anais ainda.</p>;
  }

  return (
    <section className={styles.anais} aria-labelledby="titulo-trabalhos">
      <h2 id="titulo-trabalhos" className={styles.tituloSecao} ref={topoRef}>
        Trabalhos
      </h2>

      <div className={styles.filtros} role="search">
        <div className={`${styles.campo} ${styles.campoBusca}`}>
          <label htmlFor="anais-busca">Buscar por título, autor ou palavra do resumo</label>
          <input
            id="anais-busca"
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            autoComplete="off"
          />
        </div>
        {modalidades.length > 1 && (
          <div className={styles.campo}>
            <label htmlFor="anais-modalidade">Modalidade</label>
            <select
              id="anais-modalidade"
              value={modalidadeId}
              onChange={(evento) => {
                setModalidadeId(evento.target.value);
                setAreaId("");
              }}
            >
              <option value="">Todas</option>
              {modalidades.map((modalidade) => (
                <option key={modalidade.id} value={modalidade.id}>
                  {modalidade.nome}
                </option>
              ))}
            </select>
          </div>
        )}
        {areas.length > 1 && (
          <div className={styles.campo}>
            <label htmlFor="anais-area">Área</label>
            <select id="anais-area" value={areaId} onChange={(evento) => setAreaId(evento.target.value)}>
              <option value="">Todas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.titulo}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={styles.campo}>
          <label htmlFor="anais-ordem">Ordenar</label>
          <select id="anais-ordem" value={ordem} onChange={(evento) => setOrdem(evento.target.value)}>
            {ORDENS.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.resumoFiltros}>
        <p aria-live="polite" className={styles.contagem}>
          {filtrados.length === artigos.length
            ? `${artigos.length} ${artigos.length === 1 ? "trabalho" : "trabalhos"}`
            : `${filtrados.length} de ${artigos.length} trabalhos`}
        </p>
        {autor && (
          <span className={styles.chip}>
            Autor(a): {autor}
            <button type="button" onClick={() => setAutor("")} aria-label={`Remover filtro de autor ${autor}`}>
              ×
            </button>
          </span>
        )}
        {temFiltro && (
          <button type="button" className={styles.limpar} onClick={limpar}>
            Limpar filtros
          </button>
        )}
      </div>

      {filtrados.length === 0 ? (
        <p className={styles.vazio}>
          Nenhum trabalho encontrado. Tente outra palavra ou{" "}
          <button type="button" className={styles.limparInline} onClick={limpar}>
            limpe os filtros
          </button>
          .
        </p>
      ) : grupos ? (
        grupos.map((modalidade) => (
          <section key={modalidade.id} className={styles.modalidade} aria-label={modalidade.nome}>
            <h3 className={styles.tituloModalidade}>{modalidade.nome}</h3>
            {modalidade.areas.map((area) => (
              <div key={area.id} className={styles.area}>
                {area.titulo && <p className={styles.tituloArea}>{area.titulo}</p>}
                <ul className={styles.lista}>
                  {area.artigos.map((artigo) => (
                    <CartaoArtigo key={artigo.id} artigo={artigo} edicaoSlug={edicaoSlug} aoFiltrarAutor={filtrarAutor} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))
      ) : (
        <ul className={styles.lista}>
          {filtrados.map((artigo) => (
            <CartaoArtigo
              key={artigo.id}
              artigo={artigo}
              edicaoSlug={edicaoSlug}
              aoFiltrarAutor={filtrarAutor}
              agrupado={false}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
