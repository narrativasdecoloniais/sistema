import BarraNavegacao from "@/components/publico/BarraNavegacao";
import Footer from "@/components/publico/Footer";
import BotaoContatoFlutuante from "@/components/publico/BotaoContatoFlutuante";
import VLibrasWidget from "@/components/publico/VLibrasWidget";
import ToastProvider from "@/components/publico/ToastProvider";
import { EdicaoExibidaProvider } from "@/components/publico/EdicaoExibidaContext";
import { buscarEdicaoAtual, montarPropsNavegacao } from "@/lib/publico";
import styles from "./layout.module.scss";

export default async function LayoutPublico({ children }) {
  const edicao = await buscarEdicaoAtual();

  return (
    <EdicaoExibidaProvider
      numeroEdicaoPadrao={edicao?.numero}
      navegacaoPadrao={montarPropsNavegacao(edicao)}
    >
      <div className={styles.wrapper}>
        <ToastProvider>
          <a href="#atividades" className={styles.skipLink}>
            Pular para as atividades
          </a>
          <BarraNavegacao />
          <main id="conteudo-principal" className={styles.conteudo}>
            {children}
          </main>
          <Footer edicao={edicao} />
          <VLibrasWidget />
          <BotaoContatoFlutuante email={edicao?.emailContato} />
        </ToastProvider>
      </div>
    </EdicaoExibidaProvider>
  );
}
