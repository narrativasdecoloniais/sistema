"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient";
import { comentarioAnaisSchema, extrairErros } from "@/lib/validacao";
import { useToast } from "@/components/publico/ToastProvider";
import ModalConfirmacaoPublica from "./ModalConfirmacaoPublica";
import styles from "./ComentariosArtigo.module.scss";

const LIMITE = 2000;

function formatarData(iso) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

function FormularioComentario({ artigoId, respostaAId = null, rotulo, rotuloBotao, aoPublicar, aoCancelar, autoFoco = false }) {
  const { notificar } = useToast();
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const idCampo = useId();
  const idErro = useId();
  const idContador = useId();

  async function enviar(evento) {
    evento.preventDefault();
    const resultado = comentarioAnaisSchema.safeParse({ texto });
    if (!resultado.success) {
      setErro(extrairErros(resultado).texto);
      return;
    }
    setEnviando(true);
    try {
      const { comentario, mensagem } = await apiClient.post(`/anais/artigos/${artigoId}/comentarios`, {
        texto: resultado.data.texto,
        respostaAId,
      });
      setTexto("");
      setErro("");
      notificar(mensagem || "Comentário publicado.");
      aoPublicar(comentario);
    } catch (falha) {
      notificar(falha.message, "erro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={enviar} noValidate>
      <label htmlFor={idCampo} className={styles.rotulo}>
        {rotulo}
      </label>
      <textarea
        id={idCampo}
        value={texto}
        rows={respostaAId ? 3 : 4}
        maxLength={LIMITE}
        autoFocus={autoFoco}
        aria-invalid={Boolean(erro)}
        aria-describedby={`${idContador}${erro ? ` ${idErro}` : ""}`}
        onChange={(evento) => {
          setTexto(evento.target.value);
          if (erro) setErro("");
        }}
        onBlur={() => {
          if (texto && !comentarioAnaisSchema.safeParse({ texto }).success) {
            setErro(extrairErros(comentarioAnaisSchema.safeParse({ texto })).texto);
          }
        }}
      />
      <div className={styles.linhaFormulario}>
        <span id={idContador} className={styles.contador}>
          {texto.length}/{LIMITE}
        </span>
        <div className={styles.botoesFormulario}>
          {aoCancelar && (
            <button type="button" className={styles.botaoTexto} onClick={aoCancelar} disabled={enviando}>
              Cancelar
            </button>
          )}
          <button type="submit" className={styles.botaoPrincipal} disabled={enviando}>
            {enviando ? "Publicando…" : rotuloBotao}
          </button>
        </div>
      </div>
      {erro && (
        <p id={idErro} className={styles.erro} role="alert">
          {erro}
        </p>
      )}
    </form>
  );
}

function Comentario({ comentario, usuario, artigoId, respondendo, aoResponder, aoPublicarResposta, aoExcluir, ehResposta }) {
  const proprio = usuario && comentario.usuarioId === usuario.id;
  return (
    <article className={`${styles.comentario} ${ehResposta ? styles.resposta : ""}`} aria-label={`Comentário de ${comentario.nome}`}>
      <header className={styles.cabecalhoComentario}>
        <span className={styles.nome}>{comentario.nome}</span>
        {comentario.autorDoTrabalho && <span className={styles.selo}>Autor(a) do trabalho</span>}
        <time dateTime={comentario.criadoEm} className={styles.data}>
          {formatarData(comentario.criadoEm)}
        </time>
      </header>
      <p className={styles.texto}>{comentario.texto}</p>
      {usuario && (
        <div className={styles.acoes}>
          {usuario && !ehResposta && (
            <button type="button" className={styles.botaoTexto} onClick={() => aoResponder(respondendo ? null : comentario.id)}>
              {respondendo ? "Fechar resposta" : "Responder"}
            </button>
          )}
          {proprio && (
            <button type="button" className={`${styles.botaoTexto} ${styles.botaoExcluir}`} onClick={() => aoExcluir(comentario)}>
              Excluir
            </button>
          )}
        </div>
      )}
      {respondendo && (
        <FormularioComentario
          artigoId={artigoId}
          respostaAId={comentario.id}
          rotulo={`Responder a ${comentario.nome}`}
          rotuloBotao="Publicar resposta"
          autoFoco
          aoPublicar={(resposta) => aoPublicarResposta(comentario.id, resposta)}
          aoCancelar={() => aoResponder(null)}
        />
      )}
    </article>
  );
}

// Comentários do trabalho nos Anais: só quem tem conta comenta (publica na
// hora; a organização modera no admin). Um nível de resposta.
export default function ComentariosArtigo({ artigoId, usuario, caminho }) {
  const { notificar } = useToast();
  const [comentarios, setComentarios] = useState(null);
  const [erroCarga, setErroCarga] = useState(false);
  const [respondendoId, setRespondendoId] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [processando, setProcessando] = useState(false);

  const carregar = useCallback(async () => {
    setErroCarga(false);
    try {
      const dados = await apiClient.get(`/publico/anais/artigos/${artigoId}/comentarios`);
      setComentarios(dados.comentarios);
    } catch {
      setErroCarga(true);
    }
  }, [artigoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const total = (comentarios || []).reduce((soma, comentario) => soma + 1 + comentario.respostas.length, 0);
  const cancelarExclusao = useCallback(() => setExcluindo(null), []);

  async function confirmarExclusao() {
    setProcessando(true);
    try {
      const { mensagem } = await apiClient.delete(`/anais/comentarios/${excluindo.id}`);
      setComentarios((lista) =>
        lista
          .filter((comentario) => comentario.id !== excluindo.id)
          .map((comentario) => ({
            ...comentario,
            respostas: comentario.respostas.filter((resposta) => resposta.id !== excluindo.id),
          }))
      );
      notificar(mensagem || "Comentário excluído.");
      setExcluindo(null);
    } catch (falha) {
      notificar(falha.message, "erro");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <section id="comentarios" className={styles.secao} aria-labelledby="titulo-comentarios">
      <h2 id="titulo-comentarios" className={styles.titulo}>
        Comentários{comentarios && total > 0 ? ` (${total})` : ""}
      </h2>

      {usuario ? (
        <FormularioComentario
          artigoId={artigoId}
          rotulo={`Comentar como ${usuario.nome}`}
          rotuloBotao="Publicar comentário"
          aoPublicar={(comentario) => setComentarios((lista) => [...(lista || []), comentario])}
        />
      ) : (
        <p className={styles.convite}>
          <Link href={`/login?destino=${encodeURIComponent(`${caminho}#comentarios`)}`} className={styles.botaoPrincipal}>
            Entrar para comentar
          </Link>
          <span>Só quem tem conta no site pode comentar os trabalhos.</span>
        </p>
      )}

      {erroCarga ? (
        <p className={styles.aviso}>
          Não foi possível carregar os comentários.{" "}
          <button type="button" className={styles.botaoTexto} onClick={carregar}>
            Tentar de novo
          </button>
        </p>
      ) : comentarios === null ? (
        <p className={styles.aviso} aria-live="polite">
          Carregando comentários…
        </p>
      ) : comentarios.length === 0 ? (
        <p className={styles.aviso}>Ainda não há comentários. Que tal começar a conversa?</p>
      ) : (
        <ol className={styles.lista}>
          {comentarios.map((comentario) => (
            <li key={comentario.id}>
              <Comentario
                comentario={comentario}
                usuario={usuario}
                artigoId={artigoId}
                respondendo={respondendoId === comentario.id}
                aoResponder={setRespondendoId}
                aoExcluir={setExcluindo}
                aoPublicarResposta={(paiId, resposta) => {
                  setComentarios((lista) =>
                    lista.map((item) => (item.id === paiId ? { ...item, respostas: [...item.respostas, resposta] } : item))
                  );
                  setRespondendoId(null);
                }}
              />
              {comentario.respostas.length > 0 && (
                <ol className={styles.respostas}>
                  {comentario.respostas.map((resposta) => (
                    <li key={resposta.id}>
                      <Comentario comentario={resposta} usuario={usuario} artigoId={artigoId} aoExcluir={setExcluindo} ehResposta />
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      )}

      {excluindo && (
        <ModalConfirmacaoPublica
          titulo="Excluir comentário?"
          mensagem={
            excluindo.respostaAId
              ? "A resposta será removida do trabalho."
              : "O comentário e as respostas a ele serão removidos do trabalho."
          }
          rotuloConfirmar="Excluir"
          carregando={processando}
          aoConfirmar={confirmarExclusao}
          aoCancelar={cancelarExclusao}
        />
      )}
    </section>
  );
}
