import Link from "next/link";
import styles from "./CardAtividadeProgramacao.module.scss";

export default function CardAtividadeProgramacao({ atividade, temEdicaoAtual, edicaoSlug }) {
  const meta = [
    atividade.local,
    !atividade.exigeInscricao
      ? "Sem inscrição necessária"
      : atividade.semLimiteVagas
        ? "Vagas ilimitadas"
        : `${atividade.vagas} vagas`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={styles.cartao}>
      <div className={styles.cabecalho}>
        <h3 className={styles.nome}>{atividade.tipoAtividade.nome}</h3>
        <span className={styles.tipo}>{atividade.nome}</span>
      </div>
      {meta && <p className={styles.meta}>{meta}</p>}
      {(temEdicaoAtual || edicaoSlug) && (
        <Link
          href={
            temEdicaoAtual
              ? `/atividades/${atividade.slug}`
              : `/edicoes/${edicaoSlug}/atividades/${atividade.slug}`
          }
          className={styles.detalhes}
        >
          Ver detalhes <span aria-hidden="true">→</span>
        </Link>
      )}
    </article>
  );
}
