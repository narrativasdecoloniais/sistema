import Divisor from "@/components/graficos/Divisor";
import TrabalhosAprovados from "@/components/publico/TrabalhosAprovados";
import { buscarEdicaoAtual, listarTrabalhosAprovados } from "@/lib/publico";
import styles from "./page.module.scss";

export const metadata = { title: "Trabalhos aprovados" };

export default async function PaginaTrabalhosAprovados() {
  const [edicao, trabalhos] = await Promise.all([buscarEdicaoAtual(), listarTrabalhosAprovados()]);
  const divulgado = Boolean(edicao?.resultadoDivulgadoEm);

  return (
    <article className={styles.pagina}>
      <header className={styles.cabecalho}>
        <span className={styles.eyebrow}>Submissão</span>
        <h1 className={`${styles.titulo} stencil`}>Trabalhos aprovados</h1>
        {edicao && <p className={styles.subtitulo}>{edicao.nome}</p>}
      </header>

      <Divisor className={styles.divisor} />

      {!divulgado ? (
        <p className={styles.aviso}>O resultado das submissões ainda não foi divulgado. Volte em breve.</p>
      ) : trabalhos.length === 0 ? (
        <p className={styles.aviso}>
          Os trabalhos aprovados aparecem aqui conforme os autores concluem os ajustes pedidos.
        </p>
      ) : (
        <TrabalhosAprovados trabalhos={trabalhos} />
      )}
    </article>
  );
}
