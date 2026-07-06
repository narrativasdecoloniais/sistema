"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CartaoFormulario from "@/components/publico/CartaoFormulario";
import CampoSenha from "@/components/forms/CampoSenha";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { redefinirSenhaSchema, extrairErros } from "@/lib/validacao";
import styles from "../cadastro/cadastro.module.scss";

function FormularioRedefinirSenha() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    if (!token) {
      setErroGeral("Link de redefinição inválido.");
      return;
    }

    const resultado = redefinirSenhaSchema.safeParse({ senha, confirmarSenha });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setCarregando(true);

    try {
      await apiClient.post("/auth/redefinir-senha", { token, ...resultado.data });
      router.push("/login");
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={aoSubmeter} className={styles.formulario}>
      <Alerta>{erroGeral}</Alerta>
      <CampoSenha
        id="senha"
        rotulo="Nova senha"
        value={senha}
        onChange={(evento) => setSenha(evento.target.value)}
        erro={erros.senha}
      />
      <CampoSenha
        id="confirmarSenha"
        rotulo="Confirmar nova senha"
        value={confirmarSenha}
        onChange={(evento) => setConfirmarSenha(evento.target.value)}
        erro={erros.confirmarSenha}
      />
      <Botao type="submit" carregando={carregando}>
        Redefinir senha
      </Botao>
      <p className={styles.rodape}>
        <Link href="/login">Voltar para o login</Link>
      </p>
    </form>
  );
}

export default function PaginaRedefinirSenha() {
  return (
    <CartaoFormulario titulo="Redefinir senha" subtitulo="Escolha uma nova senha para sua conta.">
      <Suspense fallback={<p>Carregando...</p>}>
        <FormularioRedefinirSenha />
      </Suspense>
    </CartaoFormulario>
  );
}
