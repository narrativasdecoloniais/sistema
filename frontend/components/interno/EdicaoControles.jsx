"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { paraNumeroRomano } from "@/lib/romanos";
import { extrairContextoEdicao } from "@/lib/rotaEdicao";
import Modal from "./Modal";
import EdicaoForm from "./EdicaoForm";
import styles from "./EdicaoControles.module.scss";

export default function EdicaoControles({ variante, usuario }) {
  const pathname = usePathname();
  const emAdmin = pathname.startsWith("/admin");
  const { id: idAtual, criando } = extrairContextoEdicao(pathname);
  const [aberto, setAberto] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [edicoes, setEdicoes] = useState([]);
  const raizRef = useRef(null);
  const botaoRef = useRef(null);

  const raizClasse = variante === "mobile" ? styles.raizMobile : styles.raizDesktop;
  const podeCriarEdicao = Boolean(usuario?.papeis?.includes("ADMIN"));

  useEffect(() => {
    if (!emAdmin) return undefined;

    let cancelado = false;
    apiClient
      .get("/edicoes")
      .then((dados) => {
        if (!cancelado) setEdicoes(dados?.edicoes || []);
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, [emAdmin, pathname]);

  useEffect(() => {
    setAberto(false);
    setModalAberto(false);
  }, [pathname]);

  useEffect(() => {
    if (!aberto) return undefined;

    function aoClicarFora(evento) {
      if (raizRef.current && !raizRef.current.contains(evento.target)) {
        setAberto(false);
      }
    }

    function aoPressionarTecla(evento) {
      if (evento.key === "Escape") {
        setAberto(false);
        botaoRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoPressionarTecla);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [aberto]);

  if (!emAdmin) {
    return <div className={`${styles.raiz} ${raizClasse}`} />;
  }

  const edicaoAtual = edicoes.find((edicao) => edicao.id === idAtual);
  const rotuloAtual = criando
    ? "Nova edição"
    : edicaoAtual
      ? `${paraNumeroRomano(edicaoAtual.numero)} — ${edicaoAtual.nome}`
      : "—";

  return (
    <div className={`${styles.raiz} ${raizClasse}`} ref={raizRef}>
      <button
        type="button"
        ref={botaoRef}
        className={styles.seletor}
        aria-haspopup="true"
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
      >
        <span className={styles.seletorTexto}>{rotuloAtual}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          aria-hidden="true"
          className={`${styles.seta} ${aberto ? styles.setaAberta : ""}`}
        />
      </button>
      {aberto && edicoes.length > 0 && (
        <div className={styles.painel}>
          {edicoes.map((edicao) => (
            <Link
              key={edicao.id}
              href={`/admin/edicoes/${edicao.id}`}
              className={`${styles.item} ${edicao.id === idAtual ? styles.itemAtivo : ""}`}
            >
              {paraNumeroRomano(edicao.numero)} — {edicao.nome}
            </Link>
          ))}
        </div>
      )}
      {!criando && podeCriarEdicao && (
        <button
          type="button"
          className={styles.criar}
          aria-label="Nova edição"
          onClick={() => setModalAberto(true)}
        >
          <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
      {modalAberto && (
        <Modal titulo="Nova edição" onFechar={() => setModalAberto(false)}>
          <EdicaoForm resumido />
        </Modal>
      )}
    </div>
  );
}
