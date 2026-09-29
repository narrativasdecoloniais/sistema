"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import CampoSelecao from "./CampoSelecao";
import CampoArea from "./CampoArea";
import { useToast } from "./ToastProvider";
import { buscarAvaliacao, registrarDecisao, sugerirArea } from "@/lib/participanteAvaliacoes";
import { DECISOES_AVALIACAO, ROTULOS_DECISAO } from "@/lib/avaliacoes";
import { sugestaoAreaSchema, extrairErros } from "@/lib/validacao";
import styles from "./AvaliacoesParticipante.module.scss";
import ConteudoRichText from "@/components/ConteudoRichText";

export default function AvaliacaoParticipante({ atribuicaoId }) {
  const { notificar } = useToast();
  const [avaliacao, setAvaliacao] = useState(null);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [salvandoDecisao, setSalvandoDecisao] = useState(null);
  const [sugerindo, setSugerindo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    buscarAvaliacao(atribuicaoId)
      .then((dados) => {
        if (!cancelado) setAvaliacao(dados);
      })
      .catch((falha) => {
        if (!cancelado) setErroCarregamento(falha.message);
      });
    return () => {
      cancelado = true;
    };
  }, [atribuicaoId]);

  async function decidir(decisao) {
    if (decisao === avaliacao.decisao) return;
    setSalvandoDecisao(decisao);
    try {
      setAvaliacao(await registrarDecisao(atribuicaoId, decisao));
      notificar(`Decisão registrada: ${ROTULOS_DECISAO[decisao]}.`);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvandoDecisao(null);
    }
  }

  const voltar = (
    <Link href="/participante/avaliacoes" className={styles.voltar}>
      <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
      Trabalhos para avaliar
    </Link>
  );

  if (erroCarregamento) {
    return (
      <div className={styles.pagina}>
        {voltar}
        <div className={styles.vazio}>
          <p>Não foi possível abrir este trabalho.</p>
          <p className={styles.vazioApoio}>{erroCarregamento}</p>
        </div>
      </div>
    );
  }

  if (!avaliacao) {
    return (
      <div className={styles.pagina}>
        {voltar}
        <div className={styles.vazio}>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  const { submissao, status } = avaliacao;
  const encerrada = status === "ENCERRADA";
  const trocaPendente = status === "TROCA_SUGERIDA";
  const outrasAreas = submissao.areasDaModalidade.filter((area) => area.id !== submissao.area?.id);
  const podeSugerir = !encerrada && !trocaPendente && !avaliacao.decisao && outrasAreas.length > 0;

  return (
    <div className={styles.pagina}>
      {voltar}

      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>{submissao.titulo}</h1>
          <p className={styles.descricao}>
            {submissao.modalidade.nome}
            {submissao.area?.titulo ? ` · ${submissao.area.titulo}` : ""}
          </p>
        </div>
      </div>

      <section className={styles.painelDecisao} aria-labelledby="titulo-decisao">
        <h2 id="titulo-decisao" className={styles.rotuloSecao}>
          Sua decisão
        </h2>

        {encerrada && (
          <p className={styles.aviso}>
            A organização já encerrou a avaliação deste trabalho. Sua decisão não pode mais ser alterada.
          </p>
        )}
        {trocaPendente && (
          <p className={styles.aviso}>
            Você sugeriu mover este trabalho para “{avaliacao.sugestaoPendente.areaSugerida.titulo}”. Aguarde a resposta
            da organização: se aprovada, o trabalho vai para os avaliadores da nova área; se recusada, você poderá
            avaliá-lo aqui.
          </p>
        )}

        <div className={styles.opcoesDecisao} role="group" aria-label="Decisão">
          {DECISOES_AVALIACAO.map((decisao) => {
            const selecionada = avaliacao.decisao === decisao.valor;
            return (
              <button
                key={decisao.valor}
                type="button"
                aria-pressed={selecionada}
                className={`${styles.opcaoDecisao} ${selecionada ? styles.opcaoDecisaoAtiva : ""}`}
                disabled={encerrada || trocaPendente || salvandoDecisao !== null}
                onClick={() => decidir(decisao.valor)}
              >
                {salvandoDecisao === decisao.valor ? "Salvando..." : decisao.rotulo}
              </button>
            );
          })}
        </div>
        {avaliacao.decisao && !encerrada && (
          <p className={styles.textoApoio}>Você pode mudar a decisão até a organização encerrar a avaliação.</p>
        )}

        {podeSugerir && (
          <div className={styles.sugestao}>
            <p className={styles.textoApoio}>Este trabalho parece pertencer a outra área?</p>
            <Botao type="button" variante="secundario" onClick={() => setSugerindo(true)}>
              Sugerir outra área
            </Botao>
          </div>
        )}
      </section>

      <section className={styles.bloco} aria-labelledby="titulo-resumo">
        <h2 id="titulo-resumo" className={styles.rotuloSecao}>
          Resumo
        </h2>
        <ConteudoRichText className={styles.corpo} html={submissao.resumo} tipo="resumo" />
      </section>

      <section className={styles.bloco} aria-labelledby="titulo-referencia">
        <h2 id="titulo-referencia" className={styles.rotuloSecao}>
          Referência bibliográfica
        </h2>
        <ConteudoRichText className={styles.corpo} html={submissao.referenciaBibliografica} tipo="referencia" />
      </section>

      {sugerindo && (
        <Modal titulo="Sugerir outra área" onFechar={() => setSugerindo(false)}>
          <FormularioSugestao
            atribuicaoId={atribuicaoId}
            areas={outrasAreas}
            aoCancelar={() => setSugerindo(false)}
            aoSalvar={(atualizada) => {
              setAvaliacao(atualizada);
              setSugerindo(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function FormularioSugestao({ atribuicaoId, areas, aoCancelar, aoSalvar }) {
  const { notificar } = useToast();
  const [areaSugeridaId, setAreaSugeridaId] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    const resultado = sugestaoAreaSchema.safeParse({ areaSugeridaId, justificativa });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);
    try {
      const atualizada = await sugerirArea(atribuicaoId, resultado.data);
      notificar("Sugestão enviada à organização.");
      aoSalvar(atualizada);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={enviar}>
      <p className={styles.textoApoio}>
        Em vez de avaliar, você indica a área que considera correta. Se a organização aprovar, o trabalho sai da sua
        lista e vai para os avaliadores da nova área.
      </p>
      <CampoSelecao
        id="areaSugerida"
        rotulo="Área sugerida"
        value={areaSugeridaId}
        onChange={(evento) => setAreaSugeridaId(evento.target.value)}
        erro={erros.areaSugeridaId}
      >
        <option value="">Selecione...</option>
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.titulo}
          </option>
        ))}
      </CampoSelecao>
      <CampoArea
        id="justificativaSugestao"
        rotulo="Justificativa (opcional)"
        linhas={4}
        value={justificativa}
        onChange={(evento) => setJustificativa(evento.target.value)}
        erro={erros.justificativa}
      />
      <div className={styles.acoesFormulario}>
        <Botao type="button" variante="secundario" onClick={aoCancelar}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={salvando}>
          Enviar sugestão
        </Botao>
      </div>
    </form>
  );
}
