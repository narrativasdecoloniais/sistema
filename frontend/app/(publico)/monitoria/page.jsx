import Link from "next/link";
import Divisor from "@/components/graficos/Divisor";
import ConteudoRichText from "@/components/ConteudoRichText";
import { buscarEdicaoAtual, formatarPeriodoEdicao } from "@/lib/publico";
import { agoraIngenuo } from "@/lib/horarioBrasilia";
import styles from "./page.module.scss";

export const metadata = { title: "Monitoria" };

// Chamada de monitoria da edição atual: edital (rich text cadastrado no
// admin, seção Monitoria) e o botão de inscrição, que leva à área do
// participante (passando pelo login). `monitoriaAberta` vem calculado do
// backend (inscricoesMonitoriaAbertas.js).
export default async function PaginaMonitoria() {
  const edicao = await buscarEdicaoAtual();
  const temEdital = Boolean(edicao?.editalMonitoria?.replace(/<[^>]*>/g, "").trim());
  const periodo =
    edicao?.inicioInscricoesMonitoria && edicao?.fimInscricoesMonitoria
      ? formatarPeriodoEdicao(edicao.inicioInscricoesMonitoria, edicao.fimInscricoesMonitoria)
      : null;
  const antesDoInicio =
    edicao?.inicioInscricoesMonitoria && agoraIngenuo() < new Date(edicao.inicioInscricoesMonitoria);

  return (
    <article className={styles.pagina}>
      <header className={styles.cabecalho}>
        <span className={styles.eyebrow}>Chamada</span>
        <h1 className={`${styles.titulo} stencil`}>Monitoria</h1>
        {edicao && <p className={styles.subtitulo}>{edicao.nome}</p>}
      </header>

      <Divisor className={styles.divisor} />

      {!temEdital ? (
        <p className={styles.aviso}>A chamada para monitoria desta edição ainda não foi publicada. Volte em breve.</p>
      ) : (
        <>
          <div className={styles.inscricao}>
            {periodo && <p className={styles.periodo}>Inscrições: {periodo}</p>}
            {edicao.monitoriaAberta ? (
              <Link href="/participante/monitoria" className={styles.cta}>
                Inscreva-se na monitoria
              </Link>
            ) : (
              <p className={styles.aviso}>
                {antesDoInicio ? "As inscrições ainda não começaram." : "As inscrições estão encerradas."}
              </p>
            )}
            {edicao.monitoriaAberta && (
              <p className={styles.apoio}>
                A inscrição é feita na área do participante: entre com sua conta ou crie uma para se inscrever.
              </p>
            )}
          </div>

          <ConteudoRichText className={styles.edital} html={edicao.editalMonitoria} tipo="edital" />
        </>
      )}
    </article>
  );
}
