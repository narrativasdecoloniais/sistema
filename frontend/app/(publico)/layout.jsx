import BarraNavegacao from "@/components/publico/BarraNavegacao";
import Footer from "@/components/publico/Footer";
import styles from "./layout.module.scss";

export default function LayoutPublico({ children }) {
  return (
    <div className={styles.wrapper}>
      <a href="#programacao" className={styles.skipLink}>
        Pular para a programação
      </a>
      <BarraNavegacao />
      <main id="conteudo-principal" className={styles.conteudo}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
