"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TelaAutenticacao from "@/components/publico/TelaAutenticacao";
import Campo from "@/components/forms/Campo";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { recuperarSenhaSchema, extrairErros } from "@/lib/validacao";
import styles from "@/components/publico/TelaAutenticacao.module.scss";

// useSearchParams exige Suspense para a página poder ser pré-renderizada.
export default function PaginaConfirmeSeuEmail() {
  return (
    <Suspense>
      <ConfirmeSeuEmail />
    </Suspense>
  );
}

function ConfirmeSeuEmail() {
  const emailCadastrado = useSearchParams().get("email") || "";
  const [email, setEmail] = useState(emailCadastrado);
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
      await apiClient.post("/auth/reenviar-confirmacao", resultado.data);
      setMensagem(
        `Se ${resultado.data.email} estiver cadastrado e pendente de confirmação, reenviamos o link para esse endereço.`
      );
    } catch (erro) {
      setMensagem(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaAutenticacao
      eyebrow="Área do participante"
      titulo="Confirme seu e-mail"
      subtitulo={
        emailCadastrado
          ? `Enviamos um link de confirmação para ${emailCadastrado}. Clique nele para ativar sua conta.`
          : "Enviamos um link de confirmação para o e-mail informado no cadastro. Clique nele para ativar sua conta."
      }
    >
      <form onSubmit={reenviar} className={styles.formulario}>
        <p className={styles.rodape}>Não encontrou o e-mail? Verifique também a caixa de spam ou lixo eletrônico.</p>
        <Alerta tipo="sucesso">{mensagem}</Alerta>
        <Campo
          id="email"
          rotulo="Não recebeu? Confira o e-mail e reenvie"
          type="email"
          variante="minimal"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          erro={erros.email}
        />
        <button type="submit" className={styles.cta} disabled={carregando}>
          {carregando ? "Aguarde..." : "Reenviar e-mail de confirmação"}
        </button>
        <p className={styles.rodape}>
          <Link href="/login">Voltar para o login</Link>
        </p>
      </form>
    </TelaAutenticacao>
  );
}
