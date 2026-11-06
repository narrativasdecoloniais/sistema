"use client";

import { MessageCircleQuestion } from "lucide-react";
import styles from "./BotaoAjuda.module.scss";

const NUMERO_WHATSAPP = "5561983287000";
const MENSAGEM_INICIAL = "Olá! Estou na área do participante do Narrativas e preciso de ajuda.";

// Ajuda pelo WhatsApp da organização, sempre à mão no topo da área do
// participante (substituiu o cartão "Precisa de ajuda?" que ficava no alto de
// inscrição, monitoria e credenciamento). Desktop: ícone + "Ajuda" na Topbar;
// celular: só o ícone, no topo da Sidebar, ao lado do avatar.
export default function BotaoAjuda({ variante = "desktop" }) {
  const href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(MENSAGEM_INICIAL)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.botao} ${variante === "mobile" ? styles.mobile : styles.desktop}`}
      title="Precisa de ajuda? Fale com a organização pelo WhatsApp"
      aria-label="Ajuda: falar com a organização pelo WhatsApp (abre em nova aba)"
    >
      <MessageCircleQuestion size={20} strokeWidth={1.5} aria-hidden="true" />
      {variante !== "mobile" && <span>Ajuda</span>}
    </a>
  );
}
