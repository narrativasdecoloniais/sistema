import Header from "@/components/publico/Header";
import Footer from "@/components/publico/Footer";
import styles from "./layout.module.scss";

export default function LayoutPublico({ children }) {
  return (
    <div className={styles.wrapper}>
      <Header />
      <div className={styles.conteudo}>{children}</div>
      <Footer />
    </div>
  );
}
