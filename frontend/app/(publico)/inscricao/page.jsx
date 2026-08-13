"use client";

import { Suspense, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Campo from "@/components/forms/Campo";
import CampoCPF from "@/components/forms/CampoCPF";
import CampoSelect from "@/components/forms/CampoSelect";
import Checkbox from "@/components/forms/Checkbox";
import { useToast } from "@/components/publico/ToastProvider";
import EtapasInscricao from "@/components/inscricao/EtapasInscricao";
import CardInscricaoConfirmada from "@/components/inscricao/CardInscricaoConfirmada";
import AtividadeSelecionavel from "@/components/inscricao/AtividadeSelecionavel";
import NavegacaoDias, { idAbaDia, idPainelDia } from "@/components/inscricao/NavegacaoDias";
import CarrosselAtividades from "@/components/inscricao/CarrosselAtividades";
import LinhaAtividade from "@/components/inscricao/LinhaAtividade";
import {
  inscricaoCpfSchema,
  inscricaoIdentidadeSchema,
  inscricaoCadastroSchema,
  extrairErros,
  categorias,
} from "@/lib/validacao";
import {
  buscarCpf,
  confirmarEmailExistente,
  cadastrarParaInscricao,
  buscarTokenPorSessao,
  buscarEstadoInscricao,
  finalizarInscricao,
  cancelarInscricaoAtividade,
  haSobreposicao,
  agruparAtividadesPorDia,
  agruparAtividadesSimultaneas,
} from "@/lib/inscricao";
import { formatarHoraAtividade, formatarDiaAtividade } from "@/lib/publico";
import styles from "./page.module.scss";

// modoAdicionar = visitante que já concluiu a inscrição geral numa visita
// anterior e voltou pra escolher mais atividades — pula direto pra seleção,
// sem repetir o passo de inscrição geral.
function calcularPassos(possuiAtividades, modoAdicionar) {
  if (modoAdicionar) return ["CPF", "Identificação", "Atividades", "Confirmação"];

  const passos = ["CPF", "Identificação", "Atividades"];
  if (possuiAtividades) passos.push("Inscrição em atividades");
  passos.push("Confirmação");
  return passos;
}

// Mesma mensagem de backend/src/middlewares/autenticarInscricao.js — usada
// pra detectar expiração do token de inscrição e resetar o fluxo.
const MENSAGEM_TOKEN_EXPIRADO = "Sessão de inscrição expirada. Volte ao início e informe seu CPF novamente.";

const CADASTRO_INICIAL = {
  nome: "",
  email: "",
  instituicao: "",
  categoria: "",
  aceiteTermos: false,
  aceitePrivacidade: false,
};

function indicePasso(etapa, possuiAtividades, modoAdicionar) {
  if (etapa === "carregando" || etapa === "cpf") return 0;
  if (etapa === "identidade" || etapa === "cadastro") return 1;
  if (modoAdicionar) return etapa === "concluido" ? 3 : 2;
  if (etapa === "inscricao-geral") return 2;
  if (etapa === "aviso-atividades" || etapa === "atividades") return possuiAtividades ? 3 : 2;
  return possuiAtividades ? 4 : 3;
}

function InscricaoConteudo() {
  const searchParams = useSearchParams();
  const slugPreSelecionado = searchParams.get("atividade");
  const { notificar } = useToast();

  const [etapa, setEtapa] = useState("carregando");
  const [cpf, setCpf] = useState("");
  const [emailIdentidade, setEmailIdentidade] = useState("");
  const [camposCadastro, setCamposCadastro] = useState(CADASTRO_INICIAL);
  const [tokenInscricao, setTokenInscricao] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [edicao, setEdicao] = useState(null);
  const [atividadesDisponiveis, setAtividadesDisponiveis] = useState([]);
  const [selecionadas, setSelecionadas] = useState(new Set());
  const [resultado, setResultado] = useState(null);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [modoAdicionar, setModoAdicionar] = useState(false);
  const [inscricaoAtual, setInscricaoAtual] = useState(null);
  const [diaAtivo, setDiaAtivo] = useState(null);

  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);

  const idDias = useId();

  // Agrupa por dia e, dentro do dia, por sobreposição de horário. Memoizado
  // porque atividadesDisponiveis só muda no carregamento, enquanto o
  // componente re-renderiza a cada clique em checkbox (selecionadas).
  const dias = useMemo(
    () =>
      agruparAtividadesPorDia(atividadesDisponiveis).map((dia) => ({
        ...dia,
        grupos: agruparAtividadesSimultaneas(dia.atividades),
      })),
    [atividadesDisponiveis]
  );

  // Dia padrão: o da atividade pré-selecionada via ?atividade=slug, senão o
  // primeiro. Derivado (não em efeito) pra não piscar sem aba ativa no
  // primeiro paint, e se autocorrige se atividadesDisponiveis mudar.
  const chavePadrao = useMemo(() => {
    const comSlug = slugPreSelecionado
      ? dias.find((dia) => dia.atividades.some((item) => item.slug === slugPreSelecionado))
      : null;
    return (comSlug || dias[0])?.chave ?? null;
  }, [dias, slugPreSelecionado]);

  const chaveAtiva =
    diaAtivo && dias.some((dia) => dia.chave === diaAtivo) ? diaAtivo : chavePadrao;
  const diaAtual = dias.find((dia) => dia.chave === chaveAtiva) ?? null;

  function tratarErro(erro) {
    if (erro.message === MENSAGEM_TOKEN_EXPIRADO) {
      setEtapa("cpf");
      setTokenInscricao("");
      notificar(erro.message, "erro");
      return;
    }
    notificar(erro.message, "erro");
  }

  async function buscarEstadoEAvancar(token) {
    const dados = await buscarEstadoInscricao(token);
    setEdicao(dados.edicao);

    if (dados.jaInscritoNaEdicao) {
      setModoAdicionar(true);
      setInscricaoAtual(dados.inscricaoAtual);
      setAtividadesDisponiveis(dados.atividades);

      if (dados.atividades.length === 0) {
        setResultado(dados.inscricaoAtual);
        setEmailEnviado(false);
        setEtapa("concluido");
        return;
      }

      setEtapa("atividades");
      return;
    }

    setAtividadesDisponiveis(dados.atividades);

    if (slugPreSelecionado) {
      const atividade = dados.atividades.find((item) => item.slug === slugPreSelecionado);
      if (atividade && !atividade.lotada) {
        setSelecionadas(new Set([atividade.id]));
      }
    }

    setEtapa("inscricao-geral");
  }

  // Se o visitante já estiver logado (cookie de sessão), pula CPF/Identificação
  // e entra direto no fluxo com o token de inscrição gerado a partir da sessão.
  // Sem sessão válida, o endpoint retorna 401 e o fluxo normal (CPF) segue.
  useEffect(() => {
    let cancelado = false;

    async function verificarSessao() {
      let dados;
      try {
        dados = await buscarTokenPorSessao();
      } catch {
        if (!cancelado) setEtapa("cpf");
        return;
      }

      if (cancelado) return;
      setTokenInscricao(dados.token);
      setNomeUsuario(dados.nome);

      try {
        await buscarEstadoEAvancar(dados.token);
      } catch (erro) {
        if (!cancelado) {
          notificar(erro.message, "erro");
          setEtapa("cpf");
        }
      }
    }

    verificarSessao();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function aoSubmeterCpf(evento) {
    evento.preventDefault();

    const resultadoValidacao = inscricaoCpfSchema.safeParse({ cpf });
    if (!resultadoValidacao.success) {
      setErros(extrairErros(resultadoValidacao));
      return;
    }
    setErros({});
    setCarregando(true);

    try {
      const dados = await buscarCpf(cpf);
      setEtapa(dados.existe ? "identidade" : "cadastro");
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setCarregando(false);
    }
  }

  async function aoSubmeterIdentidade(evento) {
    evento.preventDefault();

    const resultadoValidacao = inscricaoIdentidadeSchema.safeParse({ email: emailIdentidade });
    if (!resultadoValidacao.success) {
      setErros(extrairErros(resultadoValidacao));
      return;
    }
    setErros({});
    setCarregando(true);

    try {
      const dados = await confirmarEmailExistente({ cpf, email: emailIdentidade });
      setTokenInscricao(dados.token);
      setNomeUsuario(dados.nome);
      await buscarEstadoEAvancar(dados.token);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setCarregando(false);
    }
  }

  async function aoSubmeterCadastro(evento) {
    evento.preventDefault();

    const resultadoValidacao = inscricaoCadastroSchema.safeParse({ ...camposCadastro, cpf });
    if (!resultadoValidacao.success) {
      setErros(extrairErros(resultadoValidacao));
      return;
    }
    setErros({});
    setCarregando(true);

    try {
      const dados = await cadastrarParaInscricao(resultadoValidacao.data);
      setTokenInscricao(dados.token);
      setNomeUsuario(dados.nome);
      notificar("Cadastro realizado.", "sucesso");
      await buscarEstadoEAvancar(dados.token);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampoCadastro(campo, valor) {
    setCamposCadastro((atual) => ({ ...atual, [campo]: valor }));
  }

  function atividadeConflitante(atividade) {
    for (const outraId of selecionadas) {
      if (outraId === atividade.id) continue;
      const outra = atividadesDisponiveis.find((item) => item.id === outraId);
      if (outra && haSobreposicao(atividade, outra)) return outra;
    }

    for (const item of inscricaoAtual?.inscricoesAtividade ?? []) {
      if (haSobreposicao(atividade, item.atividade)) return item.atividade;
    }

    return null;
  }

  function conflitaComSelecionadas(atividade) {
    return Boolean(atividadeConflitante(atividade));
  }

  function aoAlternarAtividade(atividade, marcado) {
    if (marcado) {
      const conflitante = atividadeConflitante(atividade);
      if (conflitante) {
        notificar(`"${atividade.nome}" conflita com "${conflitante.nome}", já selecionada.`, "erro");
        return;
      }
    }

    setSelecionadas((atual) => {
      const novo = new Set(atual);
      if (marcado) {
        novo.add(atividade.id);
      } else {
        novo.delete(atividade.id);
      }
      return novo;
    });
  }

  async function aoFinalizar(atividadeIds = Array.from(selecionadas)) {
    if (modoAdicionar && atividadeIds.length === 0) {
      setResultado(inscricaoAtual);
      setEmailEnviado(false);
      setEtapa("concluido");
      return;
    }

    setCarregando(true);

    try {
      const dados = await finalizarInscricao(tokenInscricao, atividadeIds);
      setResultado(dados);
      setEmailEnviado(true);
      setEtapa("concluido");
      notificar(
        modoAdicionar
          ? "Atividades adicionadas! Enviamos um comprovante por e-mail."
          : "Inscrição confirmada! Enviamos um comprovante por e-mail.",
        "sucesso"
      );
    } catch (erro) {
      tratarErro(erro);
    } finally {
      setCarregando(false);
    }
  }

  // Cancela a inscrição numa atividade específica (a inscrição geral no
  // evento não é afetada) e recarrega o estado do servidor — mais simples e
  // confiável do que reconstruir manualmente os campos de vaga/tipo da
  // atividade liberada no client.
  async function aoCancelarAtividade(item) {
    try {
      await cancelarInscricaoAtividade(tokenInscricao, item.id);

      const dados = await buscarEstadoInscricao(tokenInscricao);
      setEdicao(dados.edicao);
      if (dados.jaInscritoNaEdicao) {
        setInscricaoAtual(dados.inscricaoAtual);
        setAtividadesDisponiveis(dados.atividades);
        setResultado((atual) => (atual ? dados.inscricaoAtual : atual));
      }

      notificar("Inscrição na atividade cancelada.", "sucesso");
    } catch (erro) {
      tratarErro(erro);
    }
  }

  // Único ponto que monta o cartão — garante que a lógica de conflito seja
  // idêntica no cartão avulso e no cartão dentro do carrossel.
  function renderizarCartao(atividade) {
    return (
      <AtividadeSelecionavel
        key={atividade.id}
        atividade={atividade}
        selecionada={selecionadas.has(atividade.id)}
        conflito={!selecionadas.has(atividade.id) && conflitaComSelecionadas(atividade)}
        onChange={(marcado) => aoAlternarAtividade(atividade, marcado)}
      />
    );
  }

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecalho}>
        <span className={styles.eyebrow}>Participe</span>
        <h1 className={`${styles.titulo} stencil`}>Inscreva-se</h1>
      </header>

      <EtapasInscricao
        passos={calcularPassos(atividadesDisponiveis.length > 0, modoAdicionar)}
        passoAtualIndex={indicePasso(etapa, atividadesDisponiveis.length > 0, modoAdicionar)}
      >
      {etapa === "carregando" && (
        <div className={styles.bloco}>
          <p className={styles.instrucao}>Verificando sessão...</p>
        </div>
      )}

      {etapa === "cpf" && (
        <form onSubmit={aoSubmeterCpf} className={styles.formulario}>
          <p className={styles.instrucao}>Informe seu CPF para começar.</p>
          <CampoCPF
            id="cpf"
            rotulo="CPF"
            value={cpf}
            onChange={(evento) => setCpf(evento.target.value)}
            erro={erros.cpf}
          />
          <button type="submit" className={styles.cta} disabled={carregando}>
            {carregando ? "Aguarde..." : "Continuar"}
          </button>
        </form>
      )}

      {etapa === "identidade" && (
        <form onSubmit={aoSubmeterIdentidade} className={styles.formulario}>
          <p className={styles.instrucao}>
            Esse CPF já tem cadastro. Confirme o e-mail cadastrado para continuar.
          </p>
          <Campo
            id="email"
            rotulo="E-mail cadastrado"
            type="email"
            value={emailIdentidade}
            onChange={(evento) => setEmailIdentidade(evento.target.value)}
            erro={erros.email}
          />
          <button type="submit" className={styles.cta} disabled={carregando}>
            {carregando ? "Aguarde..." : "Continuar"}
          </button>
          <button type="button" className={styles.link} onClick={() => setEtapa("cpf")}>
            Voltar e informar outro CPF
          </button>
        </form>
      )}

      {etapa === "cadastro" && (
        <form onSubmit={aoSubmeterCadastro} className={styles.formulario}>
          <p className={styles.instrucao}>
            Esse CPF ainda não tem cadastro. Preencha seus dados para continuar.
          </p>
          <Campo
            id="nome"
            rotulo="Nome completo"
            value={camposCadastro.nome}
            onChange={(evento) => atualizarCampoCadastro("nome", evento.target.value)}
            erro={erros.nome}
          />
          <Campo
            id="email"
            rotulo="E-mail"
            type="email"
            value={camposCadastro.email}
            onChange={(evento) => atualizarCampoCadastro("email", evento.target.value)}
            erro={erros.email}
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
          <button type="button" className={styles.link} onClick={() => setEtapa("cpf")}>
            Voltar e informar outro CPF
          </button>
        </form>
      )}

      {etapa === "inscricao-geral" && (
        <div className={styles.bloco}>
          <p className={styles.instrucao}>
            Olá, {nomeUsuario}. Confirme sua inscrição no evento{" "}
            <strong>{edicao?.nome}</strong>.
          </p>
          <button
            type="button"
            className={styles.cta}
            disabled={carregando}
            onClick={() => (atividadesDisponiveis.length > 0 ? setEtapa("aviso-atividades") : aoFinalizar())}
          >
            {carregando
              ? "Aguarde..."
              : atividadesDisponiveis.length > 0
                ? "Confirmar inscrição e continuar"
                : "Confirmar inscrição"}
          </button>
        </div>
      )}

      {etapa === "aviso-atividades" && (
        <div className={styles.bloco}>
          <p className={styles.instrucao}>
            A edição <strong>{edicao?.nome}</strong> tem atividades que exigem inscrição
            separada, com vagas limitadas. Você pode se inscrever nelas agora ou decidir depois.
          </p>
          <button
            type="button"
            className={styles.cta}
            disabled={carregando}
            onClick={() => setEtapa("atividades")}
          >
            Selecionar atividades
          </button>
          <button
            type="button"
            className={styles.link}
            disabled={carregando}
            onClick={() => aoFinalizar([])}
          >
            {carregando ? "Aguarde..." : "Escolher depois"}
          </button>
        </div>
      )}

      {etapa === "atividades" && (
        <div className={styles.bloco}>
          {modoAdicionar && inscricaoAtual && (
            <CardInscricaoConfirmada
              edicao={edicao}
              inscricoesAtividade={inscricaoAtual.inscricoesAtividade}
              onCancelar={aoCancelarAtividade}
            />
          )}

          <p className={styles.instrucao}>
            {modoAdicionar
              ? "Selecione mais atividades em que deseja se inscrever. Não é possível selecionar atividades com horários conflitantes com as que você já tem."
              : "Selecione as atividades em que deseja se inscrever. Não é possível selecionar atividades com horários conflitantes."}
          </p>

          {dias.length > 1 ? (
            <NavegacaoDias
              dias={dias}
              chaveAtiva={chaveAtiva}
              onSelecionar={setDiaAtivo}
              idBase={idDias}
            />
          ) : (
            diaAtual && (
              <p className={styles.diaUnico}>{formatarDiaAtividade(diaAtual.inicioIso).completo}</p>
            )
          )}

          {diaAtual && (
            <div
              className={styles.listaAtividades}
              {...(dias.length > 1
                ? {
                    role: "tabpanel",
                    id: idPainelDia(idDias, diaAtual.chave),
                    "aria-labelledby": idAbaDia(idDias, diaAtual.chave),
                  }
                : {})}
            >
              {diaAtual.grupos.map((grupo) => {
                const horaExterna =
                  grupo.length === 1
                    ? formatarHoraAtividade(grupo[0].inicioAtividade)
                    : `${formatarHoraAtividade(
                        grupo.reduce((menor, item) =>
                          new Date(item.inicioAtividade) < new Date(menor.inicioAtividade) ? item : menor
                        ).inicioAtividade
                      )}–${formatarHoraAtividade(
                        grupo.reduce((maior, item) =>
                          new Date(item.fimAtividade) > new Date(maior.fimAtividade) ? item : maior
                        ).fimAtividade
                      )}`;

                return (
                  <LinhaAtividade key={grupo[0].id} hora={horaExterna}>
                    {grupo.length === 1 ? (
                      renderizarCartao(grupo[0])
                    ) : (
                      <CarrosselAtividades
                        rotulo={`${grupo.length} atividades no mesmo horário — só é possível escolher uma.`}
                      >
                        {grupo.map(renderizarCartao)}
                      </CarrosselAtividades>
                    )}
                  </LinhaAtividade>
                );
              })}
            </div>
          )}

          <button
            type="button"
            className={styles.cta}
            disabled={carregando || selecionadas.size === 0}
            onClick={() => aoFinalizar()}
          >
            {carregando ? "Aguarde..." : "Confirmar atividades selecionadas"}
          </button>
          <button type="button" className={styles.link} disabled={carregando} onClick={() => aoFinalizar([])}>
            Escolher depois
          </button>
        </div>
      )}

      {etapa === "concluido" && resultado && (
        <div className={styles.bloco}>
          <p className={styles.instrucao}>
            {nomeUsuario}, sua inscrição está confirmada.
          </p>

          <CardInscricaoConfirmada
            titulo="Inscrição confirmada"
            edicao={edicao}
            inscricoesAtividade={resultado.inscricoesAtividade}
            onCancelar={aoCancelarAtividade}
          />

          <p className={styles.instrucao}>
            {emailEnviado
              ? "Enviamos um e-mail com esse comprovante. "
              : ""}
            Alterações na sua inscrição — como cancelar ou editar — poderão ser feitas futuramente
            fazendo login no sistema.
          </p>
          <Link href="/" className={styles.link}>
            Voltar para a página inicial
          </Link>
          <Link href="/login" className={styles.link}>
            Entrar
          </Link>
        </div>
      )}
      </EtapasInscricao>
    </div>
  );
}

export default function PaginaInscricao() {
  return (
    <Suspense fallback={null}>
      <InscricaoConteudo />
    </Suspense>
  );
}
