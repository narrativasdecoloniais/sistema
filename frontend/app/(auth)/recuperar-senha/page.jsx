"use client";

import { useState } from "react";
import Link from "next/link";
import TelaAutenticacao from "@/components/publico/TelaAutenticacao";
import Campo from "@/components/forms/Campo";
import CampoCPF from "@/components/forms/CampoCPF";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { recuperarSenhaSchema, recuperarSenhaCpfSchema, extrairErros } from "@/lib/validacao";
import styles from "@/components/publico/TelaAutenticacao.module.scss";

export default function PaginaRecuperarSenha() {
  // "email" ou "cpf" — pelo CPF serve para quem não lembra o e-mail cadastrado.
  const [modo, setModo] = useState("email");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  function trocarModo() {
    setModo((atual) => (atual === "email" ? "cpf" : "email"));
    setErros({});
    setMensagem("");
    setEnviado(false);
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setMensagem("");
    setEnviado(false);

    const resultado =
      modo === "email" ? recuperarSenhaSchema.safeParse({ email }) : recuperarSenhaCpfSchema.safeParse({ cpf });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setCarregando(true);

    try {
      if (modo === "email") {
        await apiClient.post("/auth/recuperar-senha", resultado.data);
        // Repete o endereço digitado (nunca um da base): mostra para onde foi
        // sem revelar se a conta existe.
        setMensagem(
          `Se houver uma conta com ${resultado.data.email}, enviamos para esse endereço o link para redefinir a senha.`
        );
      } else {
        const resposta = await apiClient.post("/auth/recuperar-senha/cpf", resultado.data);
        setMensagem(
          `Enviamos o link para redefinir a senha para ${resposta.emailMascarado}, o e-mail cadastrado com esse CPF.`
        );
      }
      setEnviado(true);
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaAutenticacao
      eyebrow="Área do participante"
      titulo="Recuperar senha"
      subtitulo={
        modo === "email"
          ? "Informe o e-mail cadastrado para receber o link de redefinição de senha."
          : "Informe seu CPF. Enviamos o link para o e-mail cadastrado na sua conta."
      }
    >
      <form onSubmit={aoSubmeter} className={styles.formulario}>
        <Alerta tipo={enviado ? "sucesso" : "erro"}>{mensagem}</Alerta>
        {enviado && (
          <p className={styles.rodape}>Não encontrou o e-mail? Verifique também a caixa de spam ou lixo eletrônico.</p>
        )}
        {modo === "email" ? (
          <Campo
            id="email"
            rotulo="E-mail"
            type="email"
            variante="minimal"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            erro={erros.email}
          />
        ) : (
          <CampoCPF
            id="cpf"
            rotulo="CPF"
            variante="minimal"
            value={cpf}
            onChange={(evento) => setCpf(evento.target.value)}
            erro={erros.cpf}
          />
        )}
        <button type="submit" className={styles.cta} disabled={carregando}>
          {carregando ? "Aguarde..." : "Enviar link de recuperação"}
        </button>
        <button type="button" className={styles.linkBotao} onClick={trocarModo}>
          {modo === "email" ? "Não lembra o e-mail? Recuperar pelo CPF" : "Recuperar pelo e-mail"}
        </button>
        <p className={styles.rodape}>
          Conta vinda do Even3 ou duas contas?{" "}
          <Link href="/regularizar-cadastro">Regularize seu cadastro</Link>
        </p>
        <p className={styles.rodape}>
          <Link href="/login">Voltar para o login</Link>
        </p>
      </form>
    </TelaAutenticacao>
  );
}
