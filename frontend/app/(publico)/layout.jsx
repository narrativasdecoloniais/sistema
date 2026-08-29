import BarraNavegacao from "@/components/publico/BarraNavegacao";
import Footer from "@/components/publico/Footer";
import BotaoContatoFlutuante from "@/components/publico/BotaoContatoFlutuante";
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
      <ToastProvider>
        <div className={styles.wrapper}>
          <a href="#atividades" className={styles.skipLink}>
            Pular para as atividades
          </a>
          <BarraNavegacao />
          <main id="conteudo-principal" className={styles.conteudo}>
            {children}
          </main>
          <Footer edicao={edicao} />
          <BotaoContatoFlutuante email={edicao?.emailContato} />
        </div>
      </ToastProvider>
    </EdicaoExibidaProvider>
  );
}
