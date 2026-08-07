"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import TelaAutenticacao from "@/components/publico/TelaAutenticacao";
import CampoCPF from "@/components/forms/CampoCPF";
import CampoSenha from "@/components/forms/CampoSenha";
import Checkbox from "@/components/forms/Checkbox";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { definirSenhaSchema, extrairErros } from "@/lib/validacao";
import styles from "@/components/publico/TelaAutenticacao.module.scss";

const valoresIniciais = {
  cpf: "",
  senha: "",
  confirmarSenha: "",
  aceiteTermos: false,
  aceitePrivacidade: false,
};

function FormularioDefinirSenha() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [dados, setDados] = useState(valoresIniciais);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [carregando, setCarregando] = useState(false);

  function atualizarCampo(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    if (!token) {
      setErroGeral("Link de convite inválido.");
      return;
    }

    const resultado = definirSenhaSchema.safeParse(dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setCarregando(true);

    try {
      await apiClient.post("/auth/definir-senha", { token, ...resultado.data });
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
      <CampoCPF
        id="cpf"
        rotulo="CPF"
        variante="minimal"
        value={dados.cpf}
        onChange={(evento) => atualizarCampo("cpf", evento.target.value)}
        erro={erros.cpf}
      />
      <CampoSenha
        id="senha"
        rotulo="Senha"
        variante="minimal"
        value={dados.senha}
        onChange={(evento) => atualizarCampo("senha", evento.target.value)}
        erro={erros.senha}
      />
      <CampoSenha
        id="confirmarSenha"
        rotulo="Confirmar senha"
        variante="minimal"
        value={dados.confirmarSenha}
        onChange={(evento) => atualizarCampo("confirmarSenha", evento.target.value)}
        erro={erros.confirmarSenha}
      />
      <Checkbox
        id="aceiteTermos"
        rotulo="Li e aceito os termos de uso do evento."
        checked={dados.aceiteTermos}
        onChange={(evento) => atualizarCampo("aceiteTermos", evento.target.checked)}
        erro={erros.aceiteTermos}
      />
      <Checkbox
        id="aceitePrivacidade"
        rotulo="Li e aceito a política de privacidade (LGPD)."
        checked={dados.aceitePrivacidade}
        onChange={(evento) => atualizarCampo("aceitePrivacidade", evento.target.checked)}
        erro={erros.aceitePrivacidade}
      />
      <button type="submit" className={styles.cta} disabled={carregando}>
        {carregando ? "Aguarde..." : "Definir senha e entrar"}
      </button>
      <p className={styles.rodape}>
        <Link href="/login">Voltar para o login</Link>
      </p>
    </form>
  );
}

export default function PaginaDefinirSenha() {
  return (
    <TelaAutenticacao
      eyebrow="Convite de organização"
      titulo="Defina sua senha"
      subtitulo="Escolha uma senha para acessar o painel administrativo do Narrativas."
    >
      <Suspense fallback={<p>Carregando...</p>}>
        <FormularioDefinirSenha />
      </Suspense>
    </TelaAutenticacao>
  );
}
