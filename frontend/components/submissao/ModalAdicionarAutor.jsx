"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Campo from "@/components/forms/Campo";
import Botao from "@/components/forms/Botao";
import { verificarEmailAutor } from "@/lib/submissao";
import { submissaoAutorSchema, extrairErros } from "@/lib/validacao";
import styles from "./ModalAdicionarAutor.module.scss";

const SELETOR_FOCAVEIS =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function formatarOrcid(valor) {
  const digitos = valor.replace(/[^0-9X]/gi, "").slice(0, 16);
  return digitos.match(/.{1,4}/g)?.join("-") || digitos;
}

// Mesmo padrão de acessibilidade de
// components/inscricao/ModalDetalhesAtividade.jsx (focus trap, ESC fecha,
// clique no fundo fecha, trava scroll do body,
// devolve foco ao fechar). Ao sair do e-mail, verifica se já existe uma
// conta cadastrada com esse e-mail (verificarEmailAutor) e autopreenche o
// nome — sem busca por nome nem exposição de outros dados da conta.
export default function ModalAdicionarAutor({ token, aoAdicionar, aoFechar }) {
  const painelRef = useRef(null);
  const idTitulo = useId();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [orcid, setOrcid] = useState("");
  const [contaEncontrada, setContaEncontrada] = useState(false);
  const [erros, setErros] = useState({});

  useEffect(() => {
    const elementoAnterior = document.activeElement;
    document.body.style.overflow = "hidden";

    const primeiroFocavel = painelRef.current?.querySelector(SELETOR_FOCAVEIS);
    primeiroFocavel?.focus();

    function aoPressionarTecla(evento) {
      if (evento.key === "Escape") {
        aoFechar();
        return;
      }

      if (evento.key === "Tab" && painelRef.current) {
        const focaveis = painelRef.current.querySelectorAll(SELETOR_FOCAVEIS);
        if (focaveis.length === 0) return;

        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];

        if (evento.shiftKey && document.activeElement === primeiro) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault();
          primeiro.focus();
        }
      }
    }

    document.addEventListener("keydown", aoPressionarTecla);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", aoPressionarTecla);
      elementoAnterior?.focus?.();
    };
  }, [aoFechar]);

  function aoClicarFundo(evento) {
    if (evento.target === evento.currentTarget) aoFechar();
  }

  async function aoSairDoEmail() {
    setContaEncontrada(false);
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) return;

    try {
      const dados = await verificarEmailAutor(token, email);
      if (dados.nome) {
        setNome(dados.nome);
        setContaEncontrada(true);
      }
    } catch {
      // falha silenciosa — verificação é só uma conveniência, não bloqueia o cadastro manual
    }
  }

  function aoSubmeter(evento) {
    evento.preventDefault();

    const resultadoValidacao = submissaoAutorSchema.safeParse({ nome, email, orcid });
    if (!resultadoValidacao.success) {
      setErros(extrairErros(resultadoValidacao));
      return;
    }

    aoAdicionar({
      nome: resultadoValidacao.data.nome,
      email: resultadoValidacao.data.email,
      orcid: resultadoValidacao.data.orcid || "",
    });
  }

  return createPortal(
    <div className={styles.fundo} onClick={aoClicarFundo}>
      <div
        className={styles.painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        ref={painelRef}
      >
        <div className={styles.cabecalho}>
          <h2 id={idTitulo} className={`${styles.titulo} stencil`}>
            Adicionar Autor
          </h2>
          <button type="button" className={styles.fechar} onClick={aoFechar} aria-label="Fechar">
            ×
          </button>
        </div>

        <form onSubmit={aoSubmeter} className={styles.formulario} id="formulario-adicionar-autor">
          <Campo
            id="autorEmail"
            rotulo="E-mail"
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            onBlur={aoSairDoEmail}
            erro={erros.email}
          />
          <Campo
            id="autorNome"
            rotulo="Nome"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            erro={erros.nome}
          />
          {contaEncontrada && <p className={styles.dica}>Conta encontrada: preenchemos o nome cadastrado.</p>}
          <Campo
            id="autorOrcid"
            rotulo="ORCID (opcional)"
            value={orcid}
            onChange={(evento) => setOrcid(formatarOrcid(evento.target.value))}
            placeholder="0000-0000-0000-0000"
            erro={erros.orcid}
          />
        </form>

        <div className={styles.rodape}>
          <button type="button" className={styles.linkFechar} onClick={aoFechar}>
            Fechar
          </button>
          <Botao type="submit" form="formulario-adicionar-autor">
            Adicionar Autor
          </Botao>
        </div>
      </div>
    </div>,
    document.body
  );
}
