import Link from "next/link";
import Divisor from "@/components/graficos/Divisor";
import { formatarPeriodoAtividade } from "@/lib/publico";
import styles from "./DetalheAtividade.module.scss";

// Compartilhado por /atividades/[slug] (edição atual) e
// /edicoes/[slug]/atividades/[atividadeSlug] (qualquer edição) —
// `permiteInscricao` é a única diferença de comportamento entre as duas:
// inscrição só faz sentido pra edição atual, mas descrição, pessoas
// envolvidas e horário continuam visíveis pra qualquer edição.
export default function DetalheAtividade({ atividade, permiteInscricao }) {
  const subtitulo = [
    atividade.local,
    atividade.cargaHoraria ? `${atividade.cargaHoraria}h` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={styles.pagina}>
      <header className={styles.cabecalho}>
        <span className={styles.eyebrow}>{atividade.tipoAtividade.nome}</span>
        <h1 className={`${styles.titulo} stencil`}>{atividade.nome}</h1>
        {subtitulo && <p className={styles.subtitulo}>{subtitulo}</p>}
      </header>

      <Divisor className={styles.divisor} />

      {atividade.descricao && (
        <section className={styles.secaoTexto}>
          <h2 className={styles.subtituloSecao}>Sobre a atividade</h2>
          <p>{atividade.descricao}</p>
        </section>
      )}

      {atividade.pessoas.length > 0 && (
        <section className={styles.secaoTexto}>
          <h2 className={styles.subtituloSecao}>Pessoas envolvidas</h2>
          <ul className={styles.convidadosGrade}>
            {atividade.pessoas.map((pessoa) => (
              <li key={pessoa.id} className={styles.convidadoCartao}>
                <div
                  className={styles.convidadoFoto}
                  aria-hidden={pessoa.imagem ? undefined : "true"}
                >
                  {pessoa.imagem ? (
                    <img src={pessoa.imagem} alt="" className={styles.convidadoImagem} />
                  ) : (
                    <span className={styles.convidadoInicial}>
                      {pessoa.nome.trim().charAt(0)}
                    </span>
                  )}
                </div>
                <p className={styles.convidadoNome}>{pessoa.nome}</p>
                {pessoa.tipoParticipacao && (
                  <p className={styles.convidadoAfiliacao}>{pessoa.tipoParticipacao.nome}</p>
                )}
                {pessoa.breveDescricao && (
                  <p className={styles.convidadoDescricao}>{pessoa.breveDescricao}</p>
                )}
                {pessoa.descricao && (
                  <p className={styles.convidadoDescricao}>{pessoa.descricao}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.secaoTexto}>
        <h2 className={styles.subtituloSecao}>Quando e inscrição</h2>
        <ul className={styles.sessoesLista}>
          <li className={styles.sessaoItem}>
            <div className={styles.sessaoInfoBloco}>
              <span className={styles.sessaoInfo}>
                Quando: {formatarPeriodoAtividade(atividade.inicioAtividade, atividade.fimAtividade)}
              </span>
              <span className={styles.sessaoVagas}>
                {!atividade.exigeInscricao
                  ? "Sem inscrição necessária"
                  : atividade.semLimiteVagas
                    ? "Vagas ilimitadas"
                    : `${atividade.vagas} vagas`}
              </span>
            </div>
            {atividade.exigeInscricao &&
              (permiteInscricao ? (
                <Link href={`/inscricao?atividade=${atividade.slug}`} className={styles.sessaoCta}>
                  Inscreva-se
                </Link>
              ) : (
                <span className={styles.sessaoEncerrada}>Inscrições encerradas</span>
              ))}
          </li>
        </ul>
      </section>
    </article>
  );
}
