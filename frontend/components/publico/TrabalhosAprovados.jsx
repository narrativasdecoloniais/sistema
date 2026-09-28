"use client";

import { useCallback, useMemo, useState } from "react";
import ModalResumoTrabalho from "./ModalResumoTrabalho";
import styles from "./TrabalhosAprovados.module.scss";

// Modalidade → área → trabalhos, respeitando a ordem cadastrada no admin.
function agrupar(trabalhos) {
  const modalidades = new Map();
  for (const trabalho of trabalhos) {
    const { modalidadeSubmissao: modalidade, areaSubmissao: area } = trabalho;
    if (!modalidades.has(modalidade.id)) modalidades.set(modalidade.id, { ...modalidade, areas: new Map() });
    const areas = modalidades.get(modalidade.id).areas;
    const chaveArea = area?.id || "sem-area";
    if (!areas.has(chaveArea)) areas.set(chaveArea, { id: chaveArea, titulo: area?.titulo || null, ordem: area?.ordem ?? 0, trabalhos: [] });
    areas.get(chaveArea).trabalhos.push(trabalho);
  }
  return [...modalidades.values()]
    .sort((a, b) => a.ordem - b.ordem)
    .map((modalidade) => ({ ...modalidade, areas: [...modalidade.areas.values()].sort((a, b) => a.ordem - b.ordem) }));
}

function normalizar(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function TrabalhosAprovados({ trabalhos }) {
  const [busca, setBusca] = useState("");
  const [modalidadeAtivaId, setModalidadeAtivaId] = useState(null);
  const [aberto, setAberto] = useState(null);
  const fechar = useCallback(() => setAberto(null), []);

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return trabalhos;
    return trabalhos.filter((trabalho) =>
      normalizar(`${trabalho.titulo} ${trabalho.autores.map((autor) => autor.nome).join(" ")}`).includes(termo)
    );
  }, [trabalhos, busca]);

  const grupos = useMemo(() => agrupar(filtrados), [filtrados]);
  const todasModalidades = useMemo(() => agrupar(trabalhos), [trabalhos]);
  const modalidadeAtiva = grupos.find((grupo) => grupo.id === modalidadeAtivaId) || grupos[0];

  return (
    <div className={styles.lista}>
      <div className={styles.busca}>
        <label htmlFor="buscaTrabalhosAprovados" className={styles.rotuloBusca}>
          Buscar por título ou autor
        </label>
        <input
          id="buscaTrabalhosAprovados"
          type="search"
          className={styles.campoBusca}
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
        />
      </div>

      {todasModalidades.length > 1 && (
        <div className={styles.abas} role="tablist" aria-label="Modalidades">
          {todasModalidades.map((modalidade) => {
            const selecionada = modalidadeAtiva?.id === modalidade.id;
            const disponivel = grupos.some((grupo) => grupo.id === modalidade.id);
            return (
              <button
                key={modalidade.id}
                type="button"
                role="tab"
                aria-selected={selecionada}
                disabled={!disponivel}
                className={`${styles.aba} ${selecionada ? styles.abaAtiva : ""}`}
                onClick={() => setModalidadeAtivaId(modalidade.id)}
              >
                {modalidade.nome}
              </button>
            );
          })}
        </div>
      )}

      {!modalidadeAtiva ? (
        <p className={styles.vazio}>Nenhum trabalho encontrado para a busca.</p>
      ) : (
        modalidadeAtiva.areas.map((area) => (
          <section key={area.id} className={styles.area} aria-label={area.titulo || modalidadeAtiva.nome}>
            {area.titulo && <h2 className={styles.tituloArea}>{area.titulo}</h2>}
            <ul className={styles.trabalhos}>
              {area.trabalhos.map((trabalho) => (
                <li key={trabalho.id}>
                  <button type="button" className={styles.cartao} onClick={() => setAberto(trabalho)}>
                    <span className={styles.cartaoTitulo}>{trabalho.titulo}</span>
                    <span className={styles.cartaoAutores}>{trabalho.autores.map((autor) => autor.nome).join(", ")}</span>
                    <span className={styles.cartaoAcao}>Ler resumo →</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {aberto && <ModalResumoTrabalho trabalho={aberto} aoFechar={fechar} />}
    </div>
  );
}
