"use client";

import { useState } from "react";
import Link from "next/link";
import CartaoFormulario from "@/components/publico/CartaoFormulario";
import Campo from "@/components/forms/Campo";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { recuperarSenhaSchema, extrairErros } from "@/lib/validacao";
import styles from "../cadastro.module.scss";

export default function PaginaConfirmeSeuEmail() {
  const [email, setEmail] = useState("");
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function reenviar(evento) {
    evento.preventDefault();
    setMensagem("");

    const resultado = recuperarSenhaSchema.safeParse({ email });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setCarregando(true);

    try {
      const resposta = await apiClient.post("/auth/reenviar-confirmacao", resultado.data);
      setMensagem(resposta.mensagem);
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <CartaoFormulario
      titulo="Confirme seu e-mail"
      subtitulo="Enviamos um link de confirmação para o e-mail informado no cadastro. Clique nele para ativar sua conta."
    >
      <form onSubmit={reenviar} className={styles.formulario}>
        <Alerta tipo="sucesso">{mensagem}</Alerta>
        <Campo
          id="email"
          rotulo="Não recebeu? Informe seu e-mail para reenviarmos"
          type="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          erro={erros.email}
        />
        <Botao type="submit" carregando={carregando}>
          Reenviar e-mail de confirmação
        </Botao>
        <p className={styles.rodape}>
          <Link href="/login">Voltar para o login</Link>
        </p>
      </form>
    </CartaoFormulario>
  );
}
