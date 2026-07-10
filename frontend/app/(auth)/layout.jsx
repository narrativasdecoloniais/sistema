import BarraNavegacao from "@/components/publico/BarraNavegacao";
import styles from "./layout.module.scss";

export default function LayoutAuth({ children }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.navMobile}>
        <BarraNavegacao />
      </div>
      {children}
    </div>
  );
}
