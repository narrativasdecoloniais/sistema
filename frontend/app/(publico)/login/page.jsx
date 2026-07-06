"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CartaoFormulario from "@/components/publico/CartaoFormulario";
import Campo from "@/components/forms/Campo";
import CampoSenha from "@/components/forms/CampoSenha";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { loginSchema, extrairErros } from "@/lib/validacao";
import { formatarCpf } from "@/lib/cpf";
import styles from "./login.module.scss";

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
    <CartaoFormulario titulo="Entrar" subtitulo="Acesse com o CPF cadastrado no Narrativas.">
      <form onSubmit={aoSubmeter} className={styles.formulario}>
        <Alerta>{erroGeral}</Alerta>
        <Campo
          id="cpf"
          rotulo="CPF"
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
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          erro={erros.senha}
        />
        <Link href="/recuperar-senha" className={styles.link}>
          Esqueci minha senha
        </Link>
        <Botao type="submit" carregando={carregando}>
          Entrar
        </Botao>
        <p className={styles.rodape}>
          Ainda não tem conta? <Link href="/cadastro">Inscreva-se</Link>
        </p>
        <p className={styles.rodape}>
          Não recebeu o e-mail de confirmação?{" "}
          <Link href="/cadastro/confirme-seu-email">Reenviar</Link>
        </p>
      </form>
    </CartaoFormulario>
  );
}
