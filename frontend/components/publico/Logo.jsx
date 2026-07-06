import Image from "next/image";
import logo from "@/public/logo-narrativas.png";
import styles from "./Logo.module.scss";

export default function Logo({ tamanho = "pequena" }) {
  return (
    <Image
      src={logo}
      alt="Narrativas Interculturais, Decoloniais e Antirracistas em Educação"
      className={`${styles.logo} ${tamanho === "grande" ? styles.grande : styles.pequena}`}
      priority
    />
  );
}
