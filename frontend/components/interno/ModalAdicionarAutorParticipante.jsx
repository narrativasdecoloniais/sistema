"use client";

import { useState } from "react";
import Campo from "@/components/forms/Campo";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import { verificarEmailAutor } from "@/lib/participanteSubmissoes";
import { submissaoAutorSchema, extrairErros } from "@/lib/validacao";
import styles from "./ModalAdicionarAutorParticipante.module.scss";

function formatarOrcid(valor) {
  const digitos = valor.replace(/[^0-9X]/gi, "").slice(0, 16);
  return digitos.match(/.{1,4}/g)?.join("-") || digitos;
}

export default function ModalAdicionarAutorParticipante({ aoAdicionar, aoFechar }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [orcid, setOrcid] = useState("");
  const [contaEncontrada, setContaEncontrada] = useState(false);
  const [erros, setErros] = useState({});

  async function aoSairDoEmail() {
    setContaEncontrada(false);
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) return;

    try {
      const dados = await verificarEmailAutor(email);
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

  return (
    <Modal titulo="Adicionar autor" onFechar={aoFechar}>
      <form onSubmit={aoSubmeter} className={styles.formulario}>
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
        <div className={styles.acoes}>
          <Botao type="button" variante="secundario" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao type="submit">Adicionar autor</Botao>
        </div>
      </form>
    </Modal>
  );
}
