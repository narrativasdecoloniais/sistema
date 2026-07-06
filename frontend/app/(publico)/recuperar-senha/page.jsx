"use client";

import { useState } from "react";
import Link from "next/link";
import CartaoFormulario from "@/components/publico/CartaoFormulario";
import Campo from "@/components/forms/Campo";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { recuperarSenhaSchema, extrairErros } from "@/lib/validacao";
import styles from "../cadastro/cadastro.module.scss";

export default function PaginaRecuperarSenha() {
  const [email, setEmail] = useState("");
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function aoSubmeter(evento) {
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
      const resposta = await apiClient.post("/auth/recuperar-senha", resultado.data);
      setMensagem(resposta.mensagem);
      setEnviado(true);
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <CartaoFormulario
      titulo="Recuperar senha"
      subtitulo="Informe o e-mail cadastrado para receber o link de redefinição de senha."
    >
      <form onSubmit={aoSubmeter} className={styles.formulario}>
        <Alerta tipo={enviado ? "sucesso" : "erro"}>{mensagem}</Alerta>
        <Campo
          id="email"
          rotulo="E-mail"
          type="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          erro={erros.email}
        />
        <Botao type="submit" carregando={carregando}>
          Enviar link de recuperação
        </Botao>
        <p className={styles.rodape}>
          <Link href="/login">Voltar para o login</Link>
        </p>
      </form>
    </CartaoFormulario>
  );
}
