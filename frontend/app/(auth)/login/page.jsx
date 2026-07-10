"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TelaAutenticacao from "@/components/publico/TelaAutenticacao";
import Campo from "@/components/forms/Campo";
import CampoSenha from "@/components/forms/CampoSenha";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { loginSchema, extrairErros } from "@/lib/validacao";
import { formatarCpf } from "@/lib/cpf";
import styles from "@/components/publico/TelaAutenticacao.module.scss";

export default function PaginaLogin() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    const resultado = loginSchema.safeParse({ cpf, senha });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setCarregando(true);

    try {
      await apiClient.post("/auth/login", resultado.data);
      router.push("/participante");
      router.refresh();
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaAutenticacao
      eyebrow="Área do participante"
      titulo="Entrar"
      subtitulo="Acesse com o CPF cadastrado no Narrativas."
    >
      <form onSubmit={aoSubmeter} className={styles.formulario}>
        <Alerta>{erroGeral}</Alerta>
        <Campo
          id="cpf"
          rotulo="CPF"
          variante="minimal"
          inputMode="numeric"
          placeholder="000.000.000-00"
          maxLength={14}
          value={cpf}
          onChange={(evento) => setCpf(formatarCpf(evento.target.value))}
          erro={erros.cpf}
        />
        <CampoSenha
          id="senha"
          rotulo="Senha"
          variante="minimal"
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          erro={erros.senha}
        />
        <Link href="/recuperar-senha" className={styles.link}>
          Esqueci minha senha
        </Link>
        <button type="submit" className={styles.cta} disabled={carregando}>
          {carregando ? "Aguarde..." : "Entrar"}
        </button>
        <p className={styles.rodape}>
          Ainda não tem conta? <Link href="/cadastro">Inscreva-se</Link>
        </p>
        <p className={styles.rodape}>
          Não recebeu o e-mail de confirmação?{" "}
          <Link href="/cadastro/confirme-seu-email">Reenviar</Link>
        </p>
      </form>
    </TelaAutenticacao>
  );
}
