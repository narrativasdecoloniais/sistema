"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CampoIdentificacao from "@/components/forms/CampoIdentificacao";
import CampoSenha from "@/components/forms/CampoSenha";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { loginSchema, extrairErros } from "@/lib/validacao";
import { formatarCpf } from "@/lib/cpf";
import { IDENTIFICACAO_INICIAL, payloadIdentificacao } from "@/lib/identificacao";
import { destinoSeguro } from "@/lib/destino";
import styles from "@/components/publico/TelaAutenticacao.module.scss";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Pré-preenche quando o link já traz o CPF (?cpf=).
  const [identificacao, setIdentificacao] = useState(() => ({
    ...IDENTIFICACAO_INICIAL,
    cpf: formatarCpf(searchParams.get("cpf") || ""),
  }));
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    const resultado = loginSchema.safeParse({ ...payloadIdentificacao(identificacao), senha });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setCarregando(true);

    try {
      const resposta = await apiClient.post("/auth/login", resultado.data);
      const podeAdministrar = resposta.usuario?.papeis?.some((papel) =>
        ["ADMIN", "ORGANIZADOR"].includes(papel)
      );
      const destino = destinoSeguro(searchParams.get("destino"));
      router.push(destino || (podeAdministrar ? "/admin" : "/participante"));
      router.refresh();
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={aoSubmeter} className={styles.formulario}>
      <Alerta>{erroGeral}</Alerta>
      {searchParams.get("conta") === "criada" && !erroGeral && (
        <Alerta tipo="sucesso">Conta criada. Entre com seu CPF (ou documento) e a senha que você escolheu.</Alerta>
      )}
      <CampoIdentificacao
        id="login"
        variante="minimal"
        valor={identificacao}
        onChange={setIdentificacao}
        erros={erros}
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
      <p className={styles.rodape}>
        Já se inscreveu pelo site mas nunca criou uma senha? Use “Esqueci minha senha” — o link vai para o
        e-mail da sua inscrição.
      </p>
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
      <p className={styles.rodape}>
        Conta vinda do Even3 ou duas contas?{" "}
        <Link href="/regularizar-cadastro">Regularize seu cadastro</Link>
      </p>
    </form>
  );
}
