import BarraNavegacao from "@/components/publico/BarraNavegacao";
import Footer from "@/components/publico/Footer";
import BotaoContatoFlutuante from "@/components/publico/BotaoContatoFlutuante";
import AcessibilidadeWidget from "@/components/publico/AcessibilidadeWidget";
import VLibrasWidget from "@/components/publico/VLibrasWidget";
import ToastProvider from "@/components/publico/ToastProvider";
import { EdicaoExibidaProvider } from "@/components/publico/EdicaoExibidaContext";
import { buscarEdicaoAtual, montarPropsNavegacao } from "@/lib/publico";
import styles from "./layout.module.scss";

// Script síncrono (não next/script — precisa bloquear o parsing) que reaplica
// a preferência de acessibilidade salva (AcessibilidadeWidget.jsx) em <html>
// antes da primeira pintura, pra não piscar no padrão e só depois pular pro
// salvo. Mesma técnica clássica de scripts anti-flash de tema — roda antes de
// qualquer coisa que dependa de `rem`, dos tokens ou dos filtros de modo
// visual. "contraste" é o formato antigo (só um boolean de alto contraste),
// mantido aqui só pra migrar quem já tinha a preferência salva.
const scriptAntiFlash = `
(function () {
  try {
    var dados = JSON.parse(localStorage.getItem("narrativas:acessibilidade") || "{}");
    if (dados.fonte > 0) {
      document.documentElement.classList.add("acessibilidade-fonte-" + dados.fonte);
    }
    var modoVisual = dados.modoVisual || (dados.contraste ? "alto-contraste" : null);
    if (modoVisual) {
      document.documentElement.setAttribute("data-modo-visual", modoVisual);
    }
    if (dados.linksSublinhados) {
      document.documentElement.setAttribute("data-links-sublinhados", "");
    }
    if (dados.fonteLegivel) {
      document.documentElement.setAttribute("data-fonte-legivel", "");
    }
  } catch (erro) {}
})();
`;

export default async function LayoutPublico({ children }) {
  const edicao = await buscarEdicaoAtual();

  return (
    <EdicaoExibidaProvider
      numeroEdicaoPadrao={edicao?.numero}
      navegacaoPadrao={montarPropsNavegacao(edicao)}
    >
      <div className={styles.wrapper}>
        <script dangerouslySetInnerHTML={{ __html: scriptAntiFlash }} />
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
          <AcessibilidadeWidget />
        </ToastProvider>
      </div>
    </EdicaoExibidaProvider>
  );
}
