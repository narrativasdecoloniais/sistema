import Link from "next/link";
import Logo from "@/components/publico/Logo";
import styles from "./TelaAutenticacao.module.scss";

export default function TelaAutenticacao({ eyebrow, titulo, subtitulo, children }) {
  return (
    <div className={styles.tela}>
      <Link href="/" className={styles.ladoLogo} aria-label="Voltar para a página inicial">
        <div className={styles.ladoLogoMoldura}>
          <Logo tamanho="grande" animado={false} />
        </div>
      </Link>

      <div className={styles.ladoFormulario}>
        <div className={styles.formularioWrapper}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <h1 className={`${styles.titulo} stencil`}>{titulo}</h1>
          {subtitulo && <p className={styles.subtitulo}>{subtitulo}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
