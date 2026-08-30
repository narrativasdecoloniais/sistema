"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  ClipboardList,
  Globe,
  Info,
  LayoutGrid,
  Layers,
  CalendarRange,
  Newspaper,
  Building2,
  HandHeart,
  HandCoins,
  MapPin,
  Palette,
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
  Landmark,
  Users2,
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
        {
          href: `${base}/grupos-conteudo`,
          rotulo: "Comissões e Programas",
          Icone: Landmark,
          secao: "GRUPOS_CONTEUDO",
        },
        {
          rotulo: "Página do evento",
          Icone: Globe,
          subitens: [
            { href: `${base}/pagina/hero`, rotulo: "Hero + Navbar", Icone: Globe, secao: "PAGINA_EVENTO" },
            {
              href: `${base}/pagina/apresentacao`,
              rotulo: "Apresentação",
              Icone: Info,
              secao: "PAGINA_APRESENTACAO",
            },
            {
              href: `${base}/pagina/modalidades`,
              rotulo: "Modalidades",
              Icone: LayoutGrid,
              secao: "PAGINA_MODALIDADES",
            },
            {
              href: `${base}/pagina/agenda`,
              rotulo: "Agenda/Programação",
              Icone: CalendarRange,
              secao: "PAGINA_AGENDA",
            },
            {
              href: `${base}/pagina/publicacoes`,
              rotulo: "Publicações",
              Icone: Newspaper,
              secao: "PAGINA_PUBLICACOES",
            },
            {
              href: `${base}/pagina/comissoes`,
              rotulo: "Comissões e Programas",
              Icone: Users2,
              secao: "PAGINA_COMISSOES",
            },
            {
              href: `${base}/pagina/realizadores`,
              rotulo: "Realizadores",
              Icone: Building2,
              secao: "PAGINA_REALIZADORES",
            },
            {
              href: `${base}/pagina/apoio`,
              rotulo: "Apoio",
              Icone: HandHeart,
              secao: "PAGINA_APOIO",
            },
            {
              href: `${base}/pagina/contribuicao`,
              rotulo: "Contribuição",
              Icone: HandCoins,
              secao: "PAGINA_CONTRIBUICAO",
            },
            {
              href: `${base}/pagina/localizacao`,
              rotulo: "Localização",
              Icone: MapPin,
              secao: "PAGINA_LOCALIZACAO",
            },
            {
              href: `${base}/pagina/atividades`,
              rotulo: "Atividades",
              Icone: Palette,
              secao: "PAGINA_ATIVIDADES",
            },
          ],
        },
        { href: `${base}/programacao`, rotulo: "Programação", Icone: CalendarDays, secao: "PROGRAMACAO" },
        {
          rotulo: "Submissões",
          Icone: FileText,
          subitens: [
            {
              href: `${base}/modalidades-submissao`,
              rotulo: "Modalidades de submissão",
              Icone: Layers,
              secao: "SUBMISSOES_MODALIDADES",
            },
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
        {
          href: `${base}/tipos-ponto-interesse`,
          rotulo: "Tipos de ponto de referência",
          Icone: MapPin,
          secao: "TIPOS_PONTO_INTERESSE",
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
  // Set (não um boolean único) porque agora há mais de um item com
  // subitens (Submissões, Página do evento) — cada um abre/fecha
  // independente. Aberto por padrão quando a rota atual já está dentro dele.
  const [abertos, setAbertos] = useState(() => {
    const iniciais = new Set();
    for (const grupo of grupos) {
      for (const item of grupo.itens) {
        if (item.subitens?.some((sub) => pathname.startsWith(sub.href))) {
          iniciais.add(item.rotulo);
        }
      }
    }
    return iniciais;
  });

  function alternarAberto(rotulo) {
    setAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(rotulo)) novo.delete(rotulo);
      else novo.add(rotulo);
      return novo;
    });
  }

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
                  aria-expanded={abertos.has(item.rotulo)}
                  onClick={() => alternarAberto(item.rotulo)}
                >
                  <item.Icone size={18} strokeWidth={1.5} aria-hidden="true" />
                  <span className={styles.rotulo}>{item.rotulo}</span>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className={`${styles.seta} ${abertos.has(item.rotulo) ? styles.setaAberta : ""}`}
                  />
                </button>
                {abertos.has(item.rotulo) && (
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
