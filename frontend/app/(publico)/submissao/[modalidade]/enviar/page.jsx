"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Campo from "@/components/forms/Campo";
import CampoSelect from "@/components/forms/CampoSelect";
import Checkbox from "@/components/forms/Checkbox";
import { useToast } from "@/components/publico/ToastProvider";
import FormularioSubmissao from "@/components/submissao/FormularioSubmissao";
import { submissaoEmailSchema, submissaoCadastroSchema, extrairErros, categorias } from "@/lib/validacao";
import {
  enviarLinkEntradaSubmissao,
  cadastrarParaSubmissao,
  buscarTokenPorSessaoSubmissao,
  lerSessaoSubmissaoSalva,
  salvarSessaoSubmissao,
} from "@/lib/submissao";
import styles from "./page.module.scss";

const CADASTRO_INICIAL = {
  nome: "",
  instituicao: "",
  categoria: "",
  aceiteTermos: false,
  aceitePrivacidade: false,
};

function SubmissaoConteudo() {
  const params = useParams();
  const searchParams = useSearchParams();
  const areaSlugInicial = searchParams.get("area") || null;
  const { notificar } = useToast();

  const [etapa, setEtapa] = useState("carregando");
  const [email, setEmail] = useState("");
  const [camposCadastro, setCamposCadastro] = useState(CADASTRO_INICIAL);
  const [token, setToken] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);

  // Se já houver sessão de submissão salva (voltou do link mágico) ou o
  // visitante já estiver logado no site (cookie), pula direto pro formulário.
  useEffect(() => {
    let cancelado = false;

    const sessaoSalva = lerSessaoSubmissaoSalva();
    if (sessaoSalva) {
      setToken(sessaoSalva.token);
      setNomeUsuario(sessaoSalva.nome);
      setEtapa("formulario");
      return;
    }

    async function verificarSessaoLogin() {
      try {
        const dados = await buscarTokenPorSessaoSubmissao();
        if (cancelado) return;
        salvarSessaoSubmissao(dados.token, dados.nome);
        setToken(dados.token);
        setNomeUsuario(dados.nome);
        setEtapa("formulario");
      } catch {
        if (!cancelado) setEtapa("identificar");
      }
    }

    verificarSessaoLogin();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function destinoAtual() {
    return `${window.location.pathname}${window.location.search}`;
  }

  async function aoSubmeterEmail(evento) {
    evento.preventDefault();

    const resultadoValidacao = submissaoEmailSchema.safeParse({ email });
    if (!resultadoValidacao.success) {
      setErros(extrairErros(resultadoValidacao));
      return;
    }
    setErros({});
    setCarregando(true);

    try {
      const dados = await enviarLinkEntradaSubmissao({ email, destino: destinoAtual() });
      setEtapa(dados.existe ? "aguardandoEmail" : "cadastro");
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setCarregando(false);
    }
  }

  async function aoSubmeterCadastro(evento) {
    evento.preventDefault();

    const resultadoValidacao = submissaoCadastroSchema.safeParse({ ...camposCadastro, email });
    if (!resultadoValidacao.success) {
      setErros(extrairErros(resultadoValidacao));
      return;
    }
    setErros({});
    setCarregando(true);

    try {
      await cadastrarParaSubmissao({ ...resultadoValidacao.data, destino: destinoAtual() });
      setEtapa("aguardandoEmail");
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampoCadastro(campo, valor) {
    setCamposCadastro((atual) => ({ ...atual, [campo]: valor }));
  }

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecalho}>
        <span className={styles.eyebrow}>Submissão</span>
        <h1 className={`${styles.titulo} stencil`}>Enviar trabalho</h1>
      </header>

      {etapa === "carregando" && (
        <div className={styles.bloco}>
          <p className={styles.instrucao}>Verificando sessão...</p>
        </div>
      )}

      {etapa === "identificar" && (
        <form onSubmit={aoSubmeterEmail} className={styles.formulario}>
          <p className={styles.instrucao}>
            Informe seu e-mail para começar. Enviaremos um link para confirmar sua identidade.
          </p>
          <Campo
            id="email"
            rotulo="E-mail"
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            erro={erros.email}
          />
          <button type="submit" className={styles.cta} disabled={carregando}>
            {carregando ? "Aguarde..." : "Continuar"}
          </button>
        </form>
      )}

      {etapa === "cadastro" && (
        <form onSubmit={aoSubmeterCadastro} className={styles.formulario}>
          <p className={styles.instrucao}>
            Esse e-mail ainda não tem cadastro. Preencha seus dados para continuar.
          </p>
          <Campo
            id="nome"
            rotulo="Nome completo"
            value={camposCadastro.nome}
            onChange={(evento) => atualizarCampoCadastro("nome", evento.target.value)}
            erro={erros.nome}
          />
          <Campo
            id="instituicao"
            rotulo="Instituição"
            value={camposCadastro.instituicao}
            onChange={(evento) => atualizarCampoCadastro("instituicao", evento.target.value)}
            erro={erros.instituicao}
          />
          <CampoSelect
            id="categoria"
            rotulo="Categoria"
            value={camposCadastro.categoria}
            onChange={(evento) => atualizarCampoCadastro("categoria", evento.target.value)}
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
          <Checkbox
            id="aceiteTermos"
            rotulo="Li e aceito os termos de uso do evento."
            checked={camposCadastro.aceiteTermos}
            onChange={(evento) => atualizarCampoCadastro("aceiteTermos", evento.target.checked)}
            erro={erros.aceiteTermos}
          />
          <Checkbox
            id="aceitePrivacidade"
            rotulo="Li e aceito a política de privacidade (LGPD)."
            checked={camposCadastro.aceitePrivacidade}
            onChange={(evento) => atualizarCampoCadastro("aceitePrivacidade", evento.target.checked)}
            erro={erros.aceitePrivacidade}
          />
          <button type="submit" className={styles.cta} disabled={carregando}>
            {carregando ? "Aguarde..." : "Continuar"}
          </button>
          <button type="button" className={styles.link} onClick={() => setEtapa("identificar")}>
            Voltar e informar outro e-mail
          </button>
        </form>
      )}

      {etapa === "aguardandoEmail" && (
        <div className={styles.bloco}>
          <p className={styles.instrucao}>
            Enviamos um link para <strong>{email}</strong>. Abra-o para continuar sua submissão.
          </p>
          <button type="button" className={styles.link} onClick={() => setEtapa("identificar")}>
            Voltar e informar outro e-mail
          </button>
        </div>
      )}

      {etapa === "formulario" && (
        <FormularioSubmissao
          token={token}
          nomeUsuario={nomeUsuario}
          modalidadeSlugInicial={params.modalidade}
          areaSlugInicial={areaSlugInicial}
        />
      )}
    </div>
  );
}

export default function PaginaEnviarSubmissao() {
  return (
    <Suspense fallback={null}>
      <SubmissaoConteudo />
    </Suspense>
  );
}
