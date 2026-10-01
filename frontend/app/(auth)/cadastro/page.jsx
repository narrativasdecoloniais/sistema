"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import TelaAutenticacao from "@/components/publico/TelaAutenticacao";
import Campo from "@/components/forms/Campo";
import CampoIdentificacao from "@/components/forms/CampoIdentificacao";
import CampoSelect from "@/components/forms/CampoSelect";
import CampoSenha from "@/components/forms/CampoSenha";
import Checkbox from "@/components/forms/Checkbox";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { cadastroSchema, extrairErros, categorias } from "@/lib/validacao";
import { IDENTIFICACAO_INICIAL } from "@/lib/identificacao";
import styles from "@/components/publico/TelaAutenticacao.module.scss";

const valoresIniciais = {
  nome: "",
  email: "",
  ...IDENTIFICACAO_INICIAL,
  instituicao: "",
  categoria: "",
  senha: "",
  confirmarSenha: "",
  aceiteTermos: false,
  aceitePrivacidade: false,
};

export default function PaginaCadastro() {
  return (
    <Suspense fallback={null}>
      <FormularioCadastro />
    </Suspense>
  );
}

// ?convite=<token>: convite de coautor (convitesCoautor.service.js). O
// e-mail vem do convite e fica travado; "Já tenho conta" vincula os
// trabalhos a uma conta existente, com outro e-mail.
function FormularioCadastro() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenConvite = searchParams.get("convite");
  const [dados, setDados] = useState(valoresIniciais);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [convite, setConvite] = useState(null);
  const [erroConvite, setErroConvite] = useState("");

  useEffect(() => {
    if (!tokenConvite) return;
    apiClient
      .get(`/auth/convite-coautor?token=${encodeURIComponent(tokenConvite)}`)
      .then(({ convite: dadosConvite }) => {
        setConvite(dadosConvite);
        setDados((atual) => ({ ...atual, nome: atual.nome || dadosConvite.nome, email: dadosConvite.email }));
      })
      .catch((erro) =>
        // 409: o e-mail já tem conta (a mensagem já diz para entrar com ela).
        setErroConvite(erro.status === 409 ? erro.message : `${erro.message} Você ainda pode criar sua conta normalmente.`)
      );
  }, [tokenConvite]);

  function atualizarCampo(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroGeral("");

    const resultado = cadastroSchema.safeParse(convite ? { ...dados, convite: tokenConvite } : dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setCarregando(true);

    try {
      const resposta = await apiClient.post("/auth/cadastro", resultado.data);
      if (resposta?.emailConfirmado) {
        const parametros = new URLSearchParams({ conta: "criada", destino: "/participante/submissoes" });
        if (resultado.data.cpf) parametros.set("cpf", resultado.data.cpf);
        router.push(`/login?${parametros}`);
        return;
      }
      router.push(`/cadastro/confirme-seu-email?email=${encodeURIComponent(resultado.data.email)}`);
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaAutenticacao
      eyebrow="Área do participante"
      titulo="Criar conta"
      subtitulo={
        convite
          ? `Você consta como coautor(a) de ${convite.titulos.length > 1 ? "trabalhos submetidos" : "um trabalho submetido"} ao Narrativas${convite.titulos.length ? `: ${convite.titulos.map((titulo) => `"${titulo}"`).join(", ")}` : ""}. Crie sua conta com este e-mail para ${convite.titulos.length > 1 ? "acompanhá-los" : "acompanhá-lo"}.`
          : "Preencha seus dados para se inscrever no Narrativas."
      }
    >
      <form onSubmit={aoSubmeter} className={styles.formulario}>
        <Alerta>{erroConvite}</Alerta>
        <Alerta>{erroGeral}</Alerta>
        {convite && (
          <p className={styles.rodape}>
            Já tem conta no Narrativas com outro e-mail?{" "}
            <Link href={`/participante/coautorias/vincular?convite=${encodeURIComponent(tokenConvite)}`}>
              Já tenho conta
            </Link>
          </p>
        )}
        <Campo
          id="nome"
          rotulo="Nome completo"
          variante="minimal"
          value={dados.nome}
          onChange={(evento) => atualizarCampo("nome", evento.target.value)}
          erro={erros.nome}
        />
        <Campo
          id="email"
          rotulo="E-mail"
          type="email"
          variante="minimal"
          value={dados.email}
          onChange={(evento) => atualizarCampo("email", evento.target.value)}
          erro={erros.email}
          disabled={Boolean(convite)}
        />
        <CampoIdentificacao
          id="identificacao"
          variante="minimal"
          valor={dados}
          onChange={(novo) => setDados((atual) => ({ ...atual, ...novo }))}
          erros={erros}
        />
        <Campo
          id="instituicao"
          rotulo="Instituição"
          variante="minimal"
          value={dados.instituicao}
          onChange={(evento) => atualizarCampo("instituicao", evento.target.value)}
          erro={erros.instituicao}
        />
        <CampoSelect
          id="categoria"
          rotulo="Categoria"
          variante="minimal"
          value={dados.categoria}
          onChange={(evento) => atualizarCampo("categoria", evento.target.value)}
          erro={erros.categoria}
        >
          <option value="" disabled>
            Selecione
          </option>
          {categorias.map((categoria) => (
            <option key={categoria.valor} value={categoria.valor}>
              {categoria.rotulo}
            </option>
          ))}
        </CampoSelect>
        <div className={styles.linha}>
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
        </div>
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
          {carregando ? "Aguarde..." : "Criar conta"}
        </button>
        <p className={styles.rodape}>
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </form>
    </TelaAutenticacao>
  );
}
