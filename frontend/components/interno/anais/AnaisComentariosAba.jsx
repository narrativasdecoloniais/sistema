"use client";

import { useState } from "react";
import { ExternalLink, Eye, EyeOff, Trash2 } from "lucide-react";
import ModalConfirmacao from "../ModalConfirmacao";
import CabecalhoTabela, { LinhaSemResultado } from "../CabecalhoTabela";
import BotaoExportarTabela from "../BotaoExportarTabela";
import useTabela from "../useTabela";
import { useToast } from "../ToastProvider";
import { apiClient } from "@/lib/apiClient";
import styles from "../AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./AnaisPainel.module.scss";

const ROTULOS_SITUACAO = { VISIVEL: "Visível", OCULTO: "Oculto" };
const ROTULOS_TIPO = { COMENTARIO: "Comentário", RESPOSTA: "Resposta" };
const situacaoDe = (c) => (c.ocultoEm ? "OCULTO" : "VISIVEL");
const tipoDe = (c) => (c.respostaAId ? "RESPOSTA" : "COMENTARIO");
const opcoesDe = (rotulos) => Object.entries(rotulos).map(([valor, rotulo]) => ({ valor, rotulo }));

function formatarDataHora(valor) {
  return new Date(valor).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const COLUNAS = [
  { chave: "trabalho", rotulo: "Trabalho", valor: (c) => c.artigoAnais.submissao.titulo },
  { chave: "autor", rotulo: "Quem comentou", valor: (c) => c.usuario.nome },
  { chave: "email", rotulo: "E-mail", valor: (c) => c.usuario.email },
  { chave: "texto", rotulo: "Comentário", valor: (c) => c.texto },
  { chave: "tipo", rotulo: "Tipo", valor: tipoDe, filtro: "select", opcoes: opcoesDe(ROTULOS_TIPO), exportar: (c) => ROTULOS_TIPO[tipoDe(c)] },
  {
    chave: "data",
    rotulo: "Data",
    valor: (c) => new Date(c.createdAt).getTime(),
    texto: (c) => formatarDataHora(c.createdAt),
  },
  {
    chave: "situacao",
    rotulo: "Situação",
    valor: situacaoDe,
    filtro: "select",
    opcoes: opcoesDe(ROTULOS_SITUACAO),
    exportar: (c) => ROTULOS_SITUACAO[situacaoDe(c)],
  },
];

// Moderação dos comentários dos Anais: eles aparecem na hora; aqui a
// organização oculta (reversível) ou exclui (junto com as respostas).
export default function AnaisComentariosAba({ edicaoId, comentarios, edicaoSlug, aoAlterar }) {
  const { notificar } = useToast();
  const tabela = useTabela(comentarios, COLUNAS);
  const [confirmacao, setConfirmacao] = useState(null);
  const [processando, setProcessando] = useState(false);

  function confirmar(comentario, acao) {
    const quem = comentario.usuario.nome;
    const opcoes = {
      ocultar: {
        titulo: "Ocultar comentário",
        mensagem: `O comentário de ${quem} some da página do trabalho${comentario.respostaAId ? "" : " (as respostas a ele também)"}. Dá para mostrar de novo depois.`,
        rotulo: "Ocultar",
        perigo: true,
        executar: () => apiClient.patch(`/edicoes/${edicaoId}/anais/comentarios/${comentario.id}`, { oculto: true }),
      },
      mostrar: {
        titulo: "Mostrar comentário",
        mensagem: `O comentário de ${quem} volta a aparecer na página do trabalho.`,
        rotulo: "Mostrar",
        perigo: false,
        executar: () => apiClient.patch(`/edicoes/${edicaoId}/anais/comentarios/${comentario.id}`, { oculto: false }),
      },
      excluir: {
        titulo: "Excluir comentário",
        mensagem: `O comentário de ${quem}${comentario.respostaAId ? "" : " e todas as respostas a ele"} serão apagados de vez.`,
        rotulo: "Excluir",
        perigo: true,
        executar: () => apiClient.delete(`/edicoes/${edicaoId}/anais/comentarios/${comentario.id}`),
      },
    };
    setConfirmacao(opcoes[acao]);
  }

  async function executar() {
    setProcessando(true);
    try {
      const resposta = await confirmacao.executar();
      notificar(resposta.mensagem);
      setConfirmacao(null);
      await aoAlterar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessando(false);
    }
  }

  if (comentarios.length === 0) {
    return (
      <div className={styles.vazio}>
        <p>Nenhum comentário nos trabalhos ainda.</p>
        <p className={styles.vazioApoio}>
          Quem tem conta pode comentar na página de cada trabalho, depois que os Anais forem publicados.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.tabelaWrapper}>
        <BotaoExportarTabela tabela={tabela} nomeArquivo="anais-comentarios" nomeAba="Comentários" />
        <table className={styles.tabela}>
          <CabecalhoTabela tabela={tabela} idTabela="anais-comentarios" classeAcoes={styles.colunaAcoes} />
          <tbody>
            {tabela.linhasVisiveis.length === 0 && <LinhaSemResultado tabela={tabela} colSpan={COLUNAS.length + 1} />}
            {tabela.linhasVisiveis.map((comentario) => {
              const oculto = Boolean(comentario.ocultoEm);
              return (
                <tr key={comentario.id}>
                  <td data-rotulo="Trabalho">{comentario.artigoAnais.submissao.titulo}</td>
                  <td data-rotulo="Quem comentou">{comentario.usuario.nome}</td>
                  <td data-rotulo="E-mail">{comentario.usuario.email}</td>
                  <td data-rotulo="Comentário">
                    <span className={estilos.textoComentario}>{comentario.texto}</span>
                  </td>
                  <td data-rotulo="Tipo">{ROTULOS_TIPO[tipoDe(comentario)]}</td>
                  <td data-rotulo="Data">{formatarDataHora(comentario.createdAt)}</td>
                  <td data-rotulo="Situação">{oculto ? <strong>Oculto</strong> : ROTULOS_SITUACAO.VISIVEL}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      {edicaoSlug && (
                        <a
                          href={`/anais/${edicaoSlug}/${comentario.artigoAnais.slug}#comentarios`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.botaoIcone}
                          aria-label="Ver no trabalho"
                          title="Ver no trabalho"
                        >
                          <ExternalLink size={16} strokeWidth={1.5} aria-hidden="true" />
                        </a>
                      )}
                      {oculto ? (
                        <button
                          type="button"
                          className={styles.botaoIcone}
                          aria-label={`Mostrar comentário de ${comentario.usuario.nome}`}
                          title="Mostrar"
                          onClick={() => confirmar(comentario, "mostrar")}
                        >
                          <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.botaoIcone}
                          aria-label={`Ocultar comentário de ${comentario.usuario.nome}`}
                          title="Ocultar"
                          onClick={() => confirmar(comentario, "ocultar")}
                        >
                          <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                        aria-label={`Excluir comentário de ${comentario.usuario.nome}`}
                        title="Excluir"
                        onClick={() => confirmar(comentario, "excluir")}
                      >
                        <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {confirmacao && (
        <ModalConfirmacao
          titulo={confirmacao.titulo}
          mensagem={confirmacao.mensagem}
          rotuloConfirmar={confirmacao.rotulo}
          perigo={confirmacao.perigo}
          confirmando={processando}
          onConfirmar={executar}
          onCancelar={() => setConfirmacao(null)}
        />
      )}
    </>
  );
}
