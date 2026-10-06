"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, User, CalendarCheck, FileText, ListChecks, Award, ClipboardCheck, Handshake, QrCode, IdCard } from "lucide-react";
import { temPapel } from "@/lib/permissoes";
import styles from "./NavegacaoEdicao.module.scss";

const GRUPOS = [
  {
    titulo: "Conta",
    itens: [
      { href: "/participante", rotulo: "Início", Icone: House },
      { href: "/participante/perfil", rotulo: "Meu perfil", Icone: User },
    ],
  },
  {
    titulo: "Inscrições",
    itens: [
      { href: "/participante/inscricoes", rotulo: "Minhas inscrições", Icone: CalendarCheck },
      { href: "/participante/monitoria", rotulo: "Monitoria", Icone: Handshake, prefixo: true },
      { href: "/participante/cracha", rotulo: "Meu crachá", Icone: IdCard },
      { href: "/participante/credenciamento", rotulo: "Credenciamento", Icone: QrCode, prefixo: true },
    ],
  },
  {
    titulo: "Submissões",
    itens: [
      { href: "/participante/submissoes/nova", rotulo: "Nova submissão", Icone: FileText },
      { href: "/participante/submissoes", rotulo: "Minhas submissões", Icone: ListChecks },
    ],
  },
  {
    titulo: "Pós-evento",
    itens: [{ href: "/participante/certificados", rotulo: "Emissão de certificado", Icone: Award }],
  },
];

// Só aparece para quem é avaliador em alguma edição — o papel AVALIADOR é
// mantido em sincronia com AvaliadorEdicao pelo backend (avaliacoes.service.js).
const GRUPO_AVALIACAO = {
  titulo: "Avaliação",
  itens: [{ href: "/participante/avaliacoes", rotulo: "Trabalhos para avaliar", Icone: ClipboardCheck, prefixo: true }],
};

function itemAtivo(pathname, item) {
  return pathname === item.href || (item.prefixo && pathname.startsWith(`${item.href}/`));
}

export default function NavegacaoParticipante({ usuario }) {
  const pathname = usePathname();
  const grupos = temPapel(usuario, "AVALIADOR")
    ? [...GRUPOS.slice(0, 3), GRUPO_AVALIACAO, ...GRUPOS.slice(3)]
    : GRUPOS;

  return (
    <>
      {grupos.map((grupo) => (
        <div key={grupo.titulo} className={styles.grupo}>
          <div className={styles.rotuloGrupo}>{grupo.titulo}</div>
          {grupo.itens.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.item} ${itemAtivo(pathname, item) ? styles.ativo : ""}`}
            >
              <item.Icone size={18} strokeWidth={1.5} aria-hidden="true" />
              <span className={styles.rotulo}>{item.rotulo}</span>
            </Link>
          ))}
        </div>
      ))}
    </>
  );
}
