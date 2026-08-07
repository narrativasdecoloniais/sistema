import BarraNavegacao from "@/components/publico/BarraNavegacao";
import Footer from "@/components/publico/Footer";
import styles from "./layout.module.scss";

export default function LayoutPublico({ children }) {
  return (
    <div className={styles.wrapper}>
      <a href="#atividades" className={styles.skipLink}>
        Pular para as atividades
      </a>
      <BarraNavegacao />
      <main id="conteudo-principal" className={styles.conteudo}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
