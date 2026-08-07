"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  ClipboardList,
  Globe,
  CalendarDays,
  FileText,
  Inbox,
  CheckSquare,
  ListChecks,
  Presentation,
  BookOpen,
  QrCode,
  Award,
  Settings,
  UserCog,
  Tags,
  Contact,
  UserCheck,
  CalendarCheck,
  ChevronDown,
} from "lucide-react";
import styles from "./NavegacaoEdicao.module.scss";

function montarGrupos(base) {
  return [
    {
      titulo: "Gestão",
      itens: [
        { href: base, rotulo: "Início", Icone: Home },
        { href: `${base}/participantes`, rotulo: "Usuários e Participantes", Icone: Users },
      ],
    },
    {
      titulo: "Pré-evento",
      itens: [
        { href: `${base}/atividades`, rotulo: "Atividades", Icone: ClipboardList },
        { href: `${base}/pagina`, rotulo: "Página do evento", Icone: Globe },
        { href: `${base}/programacao`, rotulo: "Programação", Icone: CalendarDays },
        {
          rotulo: "Submissões",
          Icone: FileText,
          subitens: [
            { href: `${base}/submissoes/recebimento`, rotulo: "Recebimento", Icone: Inbox },
            { href: `${base}/submissoes/avaliacao`, rotulo: "Avaliação", Icone: CheckSquare },
            { href: `${base}/submissoes/resultado`, rotulo: "Resultado", Icone: ListChecks },
            {
              href: `${base}/submissoes/apresentacao`,
              rotulo: "Apresentação",
              Icone: Presentation,
            },
            { href: `${base}/submissoes/publicacao`, rotulo: "Publicação", Icone: BookOpen },
          ],
        },
      ],
    },
    {
      titulo: "Inscrições",
      itens: [
        { href: `${base}/inscricoes`, rotulo: "Inscrições gerais", Icone: UserCheck },
        {
          href: `${base}/inscricoes/atividades`,
          rotulo: "Inscrições em atividades",
          Icone: CalendarCheck,
        },
      ],
    },
    {
      titulo: "Evento",
      itens: [{ href: `${base}/credenciamento`, rotulo: "Credenciamento", Icone: QrCode }],
    },
    {
      titulo: "Pós-evento",
      itens: [{ href: `${base}/certificados`, rotulo: "Certificados", Icone: Award }],
    },
    {
      titulo: "Configurações",
      itens: [
        { href: `${base}/evento`, rotulo: "Evento", Icone: Settings },
        { href: `${base}/organizadores`, rotulo: "Organizadores", Icone: UserCog },
        { href: `${base}/tipos-atividade`, rotulo: "Tipos de atividade", Icone: Tags },
        { href: `${base}/tipos-participacao`, rotulo: "Tipos de participação", Icone: Contact },
      ],
    },
  ];
}

export default function NavegacaoEdicao({ idEdicaoAtual }) {
  const pathname = usePathname();
  const base = `/admin/edicoes/${idEdicaoAtual}`;
  const grupos = montarGrupos(base);
  const [submissoesAberto, setSubmissoesAberto] = useState(
    pathname.startsWith(`${base}/submissoes/`)
  );

  return (
    <>
      {grupos.map((grupo) => (
        <div key={grupo.titulo} className={styles.grupo}>
          <div className={styles.rotuloGrupo}>{grupo.titulo}</div>
          {grupo.itens.map((item) =>
            item.subitens ? (
              <div key={item.rotulo}>
                <button
                  type="button"
                  className={styles.item}
                  aria-expanded={submissoesAberto}
                  onClick={() => setSubmissoesAberto((atual) => !atual)}
                >
                  <item.Icone size={18} strokeWidth={1.5} aria-hidden="true" />
                  <span className={styles.rotulo}>{item.rotulo}</span>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className={`${styles.seta} ${submissoesAberto ? styles.setaAberta : ""}`}
                  />
                </button>
                {submissoesAberto && (
                  <div className={styles.subitens}>
                    {item.subitens.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`${styles.item} ${styles.subitem} ${
                          pathname === sub.href ? styles.ativo : ""
                        }`}
                      >
                        <sub.Icone size={16} strokeWidth={1.5} aria-hidden="true" />
                        <span className={styles.rotulo}>{sub.rotulo}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.item} ${pathname === item.href ? styles.ativo : ""}`}
              >
                <item.Icone size={18} strokeWidth={1.5} aria-hidden="true" />
                <span className={styles.rotulo}>{item.rotulo}</span>
              </Link>
            )
          )}
        </div>
      ))}
    </>
  );
}
