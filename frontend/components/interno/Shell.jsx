"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import styles from "./Shell.module.scss";

export default function Shell({ usuario, children }) {
  return (
    <div className={styles.shell}>
      <Sidebar usuario={usuario} />
      <div className={styles.conteudo}>
        <Topbar usuario={usuario} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
