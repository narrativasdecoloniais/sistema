"use client";

import { MessageCircle } from "lucide-react";
import styles from "./CardAjudaInscricao.module.scss";

const NUMERO_WHATSAPP = "5561983287000";

export default function CardAjudaInscricao() {
  return (
    <a
      href={`https://wa.me/${NUMERO_WHATSAPP}`}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.cartao}
    >
      <MessageCircle size={20} strokeWidth={1.5} aria-hidden="true" className={styles.icone} />
      <span className={styles.texto}>
        <strong>Precisa de ajuda?</strong> Entre em contato pelo WhatsApp{" "}
        <span className={styles.numero}>(55) 61 98328-7000</span>
      </span>
    </a>
  );
}
