import BarraNavegacao from "@/components/publico/BarraNavegacao";
import { buscarEdicaoAtual } from "@/lib/publico";
import styles from "./layout.module.scss";

export default async function LayoutAuth({ children }) {
  const edicao = await buscarEdicaoAtual();

  return (
    <div className={styles.wrapper}>
      <div className={styles.navMobile}>
        <BarraNavegacao numeroEdicao={edicao?.numero} />
      </div>
      {children}
    </div>
  );
}
