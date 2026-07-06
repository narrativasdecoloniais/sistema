import Link from "next/link";
import Logo from "@/components/publico/Logo";
import styles from "./page.module.scss";

export default function PaginaInicial() {
  return (
    <main>
      <section className={styles.hero}>
        <span className={styles.selo}>V EDIÇÃO 2026</span>
        <Logo tamanho="grande" />
        <h1 className={`${styles.titulo} stencil`}>
          Narrativas Interculturais, Decoloniais e Antirracistas em Educação
        </h1>
        <hr className={styles.linha} />
        <p className={styles.subtitulo}>
          Um espaço de encontro entre pesquisadoras, pesquisadores, docentes,
          estudantes e comunidade para pensar educação a partir de outras
          epistemologias. Promovido pelo GPDES/UnB.
        </p>
        <Link href="/cadastro" className={styles.cta}>
          Inscreva-se
        </Link>
      </section>

      <section className={styles.blocos}>
        <div className={styles.bloco}>
          <h2 className={styles.blocoTitulo}>Programação</h2>
          <p className={styles.blocoTexto}>
            Mesas, oficinas e rodas de conversa ao longo de toda a edição —
            em breve com inscrições por atividade.
          </p>
        </div>
        <div className={styles.bloco}>
          <h2 className={styles.blocoTitulo}>Certificação</h2>
          <p className={styles.blocoTexto}>
            Participantes credenciados recebem certificado de participação
            emitido pela organização do evento.
          </p>
        </div>
        <div className={styles.bloco}>
          <h2 className={styles.blocoTitulo}>Submissão de trabalhos</h2>
          <p className={styles.blocoTexto}>
            Em breve abriremos a chamada para submissão de trabalhos para
            esta edição.
          </p>
        </div>
      </section>
    </main>
  );
}
