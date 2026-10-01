"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DefinirEdicaoExibida from "@/components/publico/DefinirEdicaoExibida";
import ArtigoAnais from "@/components/publico/anais/ArtigoAnais";
import { buscarPreviaSubmissao } from "@/lib/participanteSubmissoes";
import styles from "@/app/(publico)/anais/anais.module.scss";

// Prévia de Minhas submissões: o trabalho com o mesmo layout da página
// pública dos Anais, publicado ou não.
export default function PreviaArtigoAnais({ submissaoId }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let cancelado = false;
    buscarPreviaSubmissao(submissaoId)
      .then((resposta) => {
        if (!cancelado) setDados(resposta);
      })
      .catch((falha) => {
        if (!cancelado) setErro(falha.status === 404 ? "Trabalho não encontrado." : falha.message);
      });
    return () => {
      cancelado = true;
    };
  }, [submissaoId]);

  const voltar = (
    <Link href="/participante/submissoes" className={styles.voltarPrevia}>
      ← Minhas submissões
    </Link>
  );

  if (!dados) {
    return (
      <div className={`${styles.pagina} ${styles.paginaArtigo}`}>
        {voltar}
        <p className={styles.aviso} role={erro ? "alert" : "status"}>
          {erro || "Carregando prévia..."}
        </p>
      </div>
    );
  }

  return (
    <article className={`${styles.pagina} ${styles.paginaArtigo}`}>
      <DefinirEdicaoExibida numero={dados.edicao.numero} />
      {voltar}
      <aside className={styles.avisoPrevia} aria-label="Prévia">
        <span className={styles.eyebrow}>Prévia</span>
        <p>
          É assim que o trabalho aparecerá nos Anais, se for publicado. Páginas, data de publicação e registro
          (ISSN/ISBN) são definidos pela organização na publicação.
        </p>
      </aside>
      <ArtigoAnais artigo={dados.artigo} anais={dados.anais} edicao={dados.edicao} previa />
    </article>
  );
}
