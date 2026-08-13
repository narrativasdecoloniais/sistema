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
  Tags,
  Contact,
  UserCheck,
  CalendarCheck,
  ChevronDown,
} from "lucide-react";
import { temPermissaoSecao } from "@/lib/permissoes";
import styles from "./NavegacaoEdicao.module.scss";

function montarGrupos(base) {
  return [
    {
      titulo: "Gestão",
      itens: [
        { href: base, rotulo: "Início", Icone: Home },
        {
          href: `${base}/participantes`,
          rotulo: "Usuários e Participantes",
          Icone: Users,
          secao: "PARTICIPANTES",
        },
      ],
    },
    {
      titulo: "Pré-evento",
      itens: [
        { href: `${base}/atividades`, rotulo: "Atividades", Icone: ClipboardList, secao: "ATIVIDADES" },
        { href: `${base}/pagina`, rotulo: "Página do evento", Icone: Globe, secao: "PAGINA_EVENTO" },
        { href: `${base}/programacao`, rotulo: "Programação", Icone: CalendarDays, secao: "PROGRAMACAO" },
        {
          rotulo: "Submissões",
          Icone: FileText,
          subitens: [
            {
              href: `${base}/submissoes/recebimento`,
              rotulo: "Recebimento",
              Icone: Inbox,
              secao: "SUBMISSOES_RECEBIMENTO",
            },
            {
              href: `${base}/submissoes/avaliacao`,
              rotulo: "Avaliação",
              Icone: CheckSquare,
              secao: "SUBMISSOES_AVALIACAO",
            },
            {
              href: `${base}/submissoes/resultado`,
              rotulo: "Resultado",
              Icone: ListChecks,
              secao: "SUBMISSOES_RESULTADO",
            },
            {
              href: `${base}/submissoes/apresentacao`,
              rotulo: "Apresentação",
              Icone: Presentation,
              secao: "SUBMISSOES_APRESENTACAO",
            },
            {
              href: `${base}/submissoes/publicacao`,
              rotulo: "Publicação",
              Icone: BookOpen,
              secao: "SUBMISSOES_PUBLICACAO",
            },
          ],
        },
      ],
    },
    {
      titulo: "Inscrições",
      itens: [
        { href: `${base}/inscricoes`, rotulo: "Inscrições gerais", Icone: UserCheck, secao: "INSCRICOES_GERAIS" },
        {
          href: `${base}/inscricoes/atividades`,
          rotulo: "Inscrições em atividades",
          Icone: CalendarCheck,
          secao: "INSCRICOES_ATIVIDADES",
        },
      ],
    },
    {
      titulo: "Evento",
      itens: [
        { href: `${base}/credenciamento`, rotulo: "Credenciamento", Icone: QrCode, secao: "CREDENCIAMENTO" },
      ],
    },
    {
      titulo: "Pós-evento",
      itens: [
        { href: `${base}/certificados`, rotulo: "Certificados", Icone: Award, secao: "CERTIFICADOS" },
      ],
    },
    {
      titulo: "Configurações",
      itens: [
        { href: `${base}/evento`, rotulo: "Evento", Icone: Settings, secao: "CONFIGURACOES_EVENTO" },
        { href: `${base}/tipos-atividade`, rotulo: "Tipos de atividade", Icone: Tags, secao: "TIPOS_ATIVIDADE" },
        {
          href: `${base}/tipos-participacao`,
          rotulo: "Tipos de participação",
          Icone: Contact,
          secao: "TIPOS_PARTICIPACAO",
        },
      ],
    },
  ];
}

function filtrarPorPermissao(grupos, usuario) {
  return grupos
    .map((grupo) => {
      const itens = grupo.itens
        .map((item) => {
          if (item.subitens) {
            const subitens = item.subitens.filter(
              (sub) => !sub.secao || temPermissaoSecao(usuario, sub.secao)
            );
            return subitens.length > 0 ? { ...item, subitens } : null;
          }
          return !item.secao || temPermissaoSecao(usuario, item.secao) ? item : null;
        })
        .filter(Boolean);
      return { ...grupo, itens };
    })
    .filter((grupo) => grupo.itens.length > 0);
}

export default function NavegacaoEdicao({ idEdicaoAtual, usuario }) {
  const pathname = usePathname();
  const base = `/admin/edicoes/${idEdicaoAtual}`;
  const grupos = filtrarPorPermissao(montarGrupos(base), usuario);
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
