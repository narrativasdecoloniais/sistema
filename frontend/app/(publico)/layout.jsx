import BarraNavegacao from "@/components/publico/BarraNavegacao";
import Footer from "@/components/publico/Footer";
import { EdicaoExibidaProvider } from "@/components/publico/EdicaoExibidaContext";
import { buscarEdicaoAtual } from "@/lib/publico";
import styles from "./layout.module.scss";

export default async function LayoutPublico({ children }) {
  const edicao = await buscarEdicaoAtual();

  return (
    <EdicaoExibidaProvider numeroEdicaoPadrao={edicao?.numero}>
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
    </EdicaoExibidaProvider>
  );
}
