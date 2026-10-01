"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Botao from "@/components/forms/Botao";
import { paraNumeroRomano } from "@/lib/romanos";
import { listarMinhasSubmissoes } from "@/lib/participanteSubmissoes";
import { listarModalidadesSubmissaoPublicas, prazoSubmissaoAberto } from "@/lib/publico";
import { ROTULOS_DECISAO, formatarPrazoCorrecao } from "@/lib/avaliacoes";
import { detalheAtividade, linkAtividade } from "@/lib/apresentacao";
import { ROTULOS_SITUACAO_COAUTOR, formatarDataHoraCurta } from "@/lib/coautores";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "./ToastProvider";
import styles from "./SubmissoesParticipantePainel.module.scss";

function formatarData(iso) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function SubmissoesParticipantePainel() {
  const router = useRouter();
  const [submissoes, setSubmissoes] = useState(null);
  const [modalidades, setModalidades] = useState(null);

  useEffect(() => {
    let cancelado = false;
    listarMinhasSubmissoes()
      .then((dados) => {
        if (!cancelado) setSubmissoes(dados);
      })
      .catch(() => {
        if (!cancelado) setSubmissoes([]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;
    listarModalidadesSubmissaoPublicas()
      .then((dados) => {
        if (!cancelado) setModalidades(dados);
      })
      .catch(() => {
        if (!cancelado) setModalidades([]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Cada modalidade tem seu próprio prazo, então o botão só é bloqueado
  // quando nenhuma delas está aberta — com pelo menos uma aberta, o
  // próprio formulário (FormularioSubmissaoParticipante) já impede a
  // escolha das modalidades encerradas.
  const carregandoModalidades = modalidades === null;
  const temModalidadeAberta = (modalidades || []).some((modalidade) =>
    prazoSubmissaoAberto(modalidade.prazoInicio, modalidade.prazoFim)
  );
  const novaSubmissaoBloqueada = !carregandoModalidades && !temModalidadeAberta;

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Minhas submissões</h1>
          <p className={styles.descricao}>Trabalhos que você enviou, como autor principal ou coautor.</p>
          {novaSubmissaoBloqueada && (
            <p className={styles.avisoPrazo}>Nenhuma modalidade de submissão está com prazo aberto no momento.</p>
          )}
        </div>
        <Botao
          type="button"
          onClick={() => router.push("/participante/submissoes/nova")}
          disabled={carregandoModalidades || novaSubmissaoBloqueada}
          title={novaSubmissaoBloqueada ? "Nenhuma modalidade de submissão está com prazo aberto no momento." : undefined}
        >
          <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
          Nova submissão
        </Botao>
      </div>

      {submissoes === null ? (
        <div className={styles.vazio}>
          <p>Carregando...</p>
        </div>
      ) : submissoes.length === 0 ? (
        <div className={styles.vazio}>
          <p>Você ainda não enviou nenhum trabalho.</p>
          <p className={styles.vazioApoio}>Use o botão acima para fazer sua primeira submissão.</p>
        </div>
      ) : (
        <div className={styles.grade}>
          {submissoes.map((submissao) => (
            <article key={submissao.id} className={styles.cartao}>
              <div className={styles.cartaoCabecalho}>
                <h3 className={styles.cartaoTitulo}>{submissao.titulo}</h3>
                <span className={styles.cartaoEdicao}>{paraNumeroRomano(submissao.edicao.numero)}</span>
              </div>
              <p className={styles.cartaoMeta}>
                {submissao.modalidadeSubmissao.nome}
                {submissao.areaSubmissao?.titulo ? ` · ${submissao.areaSubmissao.titulo}` : ""}
              </p>
              <p className={styles.cartaoAutores}>
                {submissao.autores.map((autor) => autor.nome).join(", ")}
              </p>
              {submissao.ehAutorPrincipal && submissao.autores.some((autor) => autor.cadastro) && (
                <CoautoresSubmissao submissao={submissao} setSubmissoes={setSubmissoes} />
              )}
              <div className={styles.cartaoRodape}>
                <p className={styles.cartaoData}>Enviado em {formatarData(submissao.createdAt)}</p>
                <Link href={`/participante/submissoes/${submissao.id}/previa`} className={styles.linkVerTrabalho}>
                  Ver trabalho
                </Link>
              </div>
              {submissao.resultado && (
                <ResultadoSubmissao id={submissao.id} resultado={submissao.resultado} ehAutorPrincipal={submissao.ehAutorPrincipal} />
              )}
              {submissao.apresentacao && (
                <div className={styles.resultado}>
                  <p className={styles.resultadoDecisao}>
                    <span className={styles.resultadoRotulo}>Apresentação</span>
                    <Link
                      href={linkAtividade(submissao.edicao, submissao.apresentacao.atividade)}
                      className={styles.linkAtividade}
                    >
                      {submissao.apresentacao.atividade.nome}
                    </Link>
                  </p>
                  <p className={styles.resultadoTexto}>{detalheAtividade(submissao.apresentacao.atividade)}</p>
                  {submissao.apresentacao.ordem && (
                    <p className={styles.resultadoTexto}>Ordem de apresentação: {submissao.apresentacao.ordem}º</p>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// Só o autor principal recebe a situação de cadastro dos coautores (a API
// omite para coautores). Reenvio: no máximo um a cada 24 h por coautor.
function CoautoresSubmissao({ submissao, setSubmissoes }) {
  const { notificar } = useToast();
  const [reenviando, setReenviando] = useState(null);
  const coautores = submissao.autores.filter((autor) => autor.cadastro);

  async function reenviar(autor) {
    setReenviando(autor.id);
    try {
      const resposta = await apiClient.post(`/participante/submissoes/${submissao.id}/autores/${autor.id}/convite`);
      notificar(resposta.mensagem);
      setSubmissoes((atuais) =>
        atuais.map((item) =>
          item.id !== submissao.id
            ? item
            : {
                ...item,
                autores: item.autores.map((outro) =>
                  outro.id === autor.id ? { ...outro, cadastro: { ...outro.cadastro, situacao: "NA_FILA" } } : outro
                ),
              }
        )
      );
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setReenviando(null);
    }
  }

  return (
    <ul className={styles.coautores} aria-label="Cadastro dos coautores">
      {coautores.map((autor) => {
        const { situacao, enviadoEm } = autor.cadastro;
        return (
          <li key={autor.id} className={styles.coautor}>
            <span>{autor.nome}</span>
            <span className={situacao === "CADASTRADO" ? styles.coautorCadastrado : styles.coautorSituacao}>
              {ROTULOS_SITUACAO_COAUTOR[situacao]}
              {situacao === "CONVITE_ENVIADO" && enviadoEm ? ` em ${formatarDataHoraCurta(enviadoEm)}` : ""}
            </span>
            {situacao !== "CADASTRADO" && situacao !== "NA_FILA" && (
              <button
                type="button"
                className={styles.botaoTexto}
                onClick={() => reenviar(autor)}
                disabled={reenviando === autor.id}
              >
                {reenviando === autor.id ? "Enviando..." : enviadoEm ? "Reenviar convite" : "Enviar convite"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const ACAO_CORRECAO = {
  APROVADO_COM_RESSALVAS: { botao: "Corrigir trabalho", verbo: "enviar a versão corrigida" },
  APROVADO_FORMATACAO: { botao: "Revisar formatação", verbo: "revisar a formatação do resumo e das referências" },
};

// Só chega preenchido depois que a organização divulga o resultado (a API
// omite a decisão antes disso).
function ResultadoSubmissao({ id, resultado, ehAutorPrincipal }) {
  const acao = ACAO_CORRECAO[resultado.decisao];
  const prazo = formatarPrazoCorrecao(resultado.prazoCorrecao);
  const pendente = ["PENDENTE", "DEVOLVIDA"].includes(resultado.statusCorrecao);

  let situacao = null;
  if (acao) {
    if (resultado.statusCorrecao === "CONCLUIDA") situacao = "Correção concluída.";
    else if (resultado.statusCorrecao === "ENVIADA") situacao = "Correção enviada — aguardando conferência da organização.";
    else if (!resultado.prazoAberto) situacao = `O prazo de correção terminou em ${prazo}. Fale com a organização.`;
    else if (ehAutorPrincipal) situacao = `Você precisa ${acao.verbo} até ${prazo}.`;
    else situacao = `O autor principal precisa ${acao.verbo} até ${prazo}.`;
  }

  return (
    <div className={styles.resultado}>
      <p className={styles.resultadoDecisao}>
        <span className={styles.resultadoRotulo}>Resultado</span>
        {ROTULOS_DECISAO[resultado.decisao]}
      </p>
      {resultado.observacao && <p className={styles.resultadoTexto}>{resultado.observacao}</p>}
      {resultado.statusCorrecao === "DEVOLVIDA" && resultado.motivoDevolucao && (
        <p className={styles.resultadoTexto}>
          <strong>Correção devolvida:</strong> {resultado.motivoDevolucao}
        </p>
      )}
      {situacao && <p className={pendente && resultado.prazoAberto ? styles.resultadoPendente : styles.resultadoTexto}>{situacao}</p>}
      {resultado.podeCorrigir && acao && (
        <Link href={`/participante/submissoes/${id}/correcao`} className={styles.resultadoAcao}>
          {acao.botao}
        </Link>
      )}
    </div>
  );
}
