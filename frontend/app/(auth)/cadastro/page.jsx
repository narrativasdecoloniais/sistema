"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TelaAutenticacao from "@/components/publico/TelaAutenticacao";
import Campo from "@/components/forms/Campo";
import CampoCPF from "@/components/forms/CampoCPF";
import CampoSelect from "@/components/forms/CampoSelect";
import CampoSenha from "@/components/forms/CampoSenha";
import Checkbox from "@/components/forms/Checkbox";
import Alerta from "@/components/forms/Alerta";
import { apiClient } from "@/lib/apiClient";
import { cadastroSchema, extrairErros, categorias } from "@/lib/validacao";
import styles from "@/components/publico/TelaAutenticacao.module.scss";

const valoresIniciais = {
  nome: "",
  email: "",
  cpf: "",
  instituicao: "",
  categoria: "",
  senha: "",
  confirmarSenha: "",
  aceiteTermos: false,
  aceitePrivacidade: false,
};

export default function PaginaCadastro() {
  const router = useRouter();
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

    const resultado = cadastroSchema.safeParse(dados);
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setCarregando(true);

    try {
      await apiClient.post("/auth/cadastro", resultado.data);
      router.push("/cadastro/confirme-seu-email");
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
      subtitulo="Preencha seus dados para se inscrever no Narrativas."
    >
      <form onSubmit={aoSubmeter} className={styles.formulario}>
        <Alerta>{erroGeral}</Alerta>
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
        />
        <CampoCPF
          id="cpf"
          rotulo="CPF"
          variante="minimal"
          value={dados.cpf}
          onChange={(evento) => atualizarCampo("cpf", evento.target.value)}
          erro={erros.cpf}
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
