"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CalendarCheck, FileText, ListChecks, Award } from "lucide-react";
import styles from "./NavegacaoEdicao.module.scss";

const GRUPOS = [
  {
    titulo: "Conta",
    itens: [{ href: "/participante", rotulo: "Meu perfil", Icone: User }],
  },
  {
    titulo: "Inscrições",
    itens: [{ href: "/participante/inscricoes", rotulo: "Minhas inscrições", Icone: CalendarCheck }],
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

export default function NavegacaoParticipante() {
  const pathname = usePathname();

  return (
    <>
      {GRUPOS.map((grupo) => (
        <div key={grupo.titulo} className={styles.grupo}>
          <div className={styles.rotuloGrupo}>{grupo.titulo}</div>
          {grupo.itens.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.item} ${pathname === item.href ? styles.ativo : ""}`}
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
