"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, CalendarCheck, QrCode, FileText, ClipboardCheck, Handshake, Award } from "lucide-react";
import { temPapel } from "@/lib/permissoes";
import { buscarResumoParticipante } from "@/lib/participanteResumo";
import styles from "./NavegacaoEdicao.module.scss";

// Uma área por item, sem grupos: crachá e leitor de QR ficam juntos em
// Credenciamento, "Nova submissão" é um botão dentro de Submissões e o perfil
// fica no menu da conta (avatar). No celular o Início também serve de índice
// de tudo isto (InicioParticipantePainel).
const ITENS = [
  { href: "/participante", rotulo: "Início", Icone: House },
  { href: "/participante/inscricoes", rotulo: "Inscrição", Icone: CalendarCheck, prefixo: true },
  { href: "/participante/credenciamento", rotulo: "Credenciamento", Icone: QrCode, prefixo: true },
  { href: "/participante/submissoes", rotulo: "Submissões", Icone: FileText, prefixo: true },
  // Só para quem é avaliador em alguma edição — o papel AVALIADOR é mantido
  // em sincronia com AvaliadorEdicao pelo backend (avaliacoes.service.js).
  { href: "/participante/avaliacoes", rotulo: "Trabalhos para avaliar", Icone: ClipboardCheck, prefixo: true, so: "avaliador" },
  // Só com edital de monitoria publicado na edição atual (o resumo devolve
  // `monitoria: null` sem edital).
  { href: "/participante/monitoria", rotulo: "Monitoria", Icone: Handshake, prefixo: true, so: "monitoria" },
  { href: "/participante/certificados", rotulo: "Certificados", Icone: Award },
];

function itemAtivo(pathname, item) {
  return pathname === item.href || (item.prefixo && pathname.startsWith(`${item.href}/`));
}

export default function NavegacaoParticipante({ usuario }) {
  const pathname = usePathname();
  const [temMonitoria, setTemMonitoria] = useState(false);

  useEffect(() => {
    let cancelado = false;
    buscarResumoParticipante()
      .then((resumo) => {
        if (!cancelado) setTemMonitoria(Boolean(resumo?.monitoria));
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, []);

  const visiveis = ITENS.filter((item) => {
    if (item.so === "avaliador") return temPapel(usuario, "AVALIADOR");
    // Quem já está numa tela de monitoria (link salvo, página pública) vê o item ativo.
    if (item.so === "monitoria") return temMonitoria || itemAtivo(pathname, item);
    return true;
  });

  return (
    <div className={styles.grupo}>
      {visiveis.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.item} ${itemAtivo(pathname, item) ? styles.ativo : ""}`}
          aria-current={itemAtivo(pathname, item) ? "page" : undefined}
        >
          <item.Icone size={18} strokeWidth={1.5} aria-hidden="true" />
          <span className={styles.rotulo}>{item.rotulo}</span>
        </Link>
      ))}
    </div>
  );
}
