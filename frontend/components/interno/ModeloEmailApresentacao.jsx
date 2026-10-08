"use client";

import { useEffect, useState } from "react";
import Botao from "@/components/forms/Botao";
import CampoRichText from "@/components/forms/CampoRichText";
import ConteudoRichText from "@/components/ConteudoRichText";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import CampoTexto from "./CampoTexto";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { modeloEmailApresentacaoSchema, extrairErros } from "@/lib/validacao";
import {
  MARCADORES_EMAIL_APRESENTACAO,
  preencherEmailApresentacao,
  valoresExemploApresentacao,
} from "@/lib/emailApresentacao";
// Mesmo visual do texto dos e-mails de resultado (ResultadoModelosEmail).
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilosResultado from "./ResultadoSubmissoesPainel.module.scss";

// Aba "E-mail de aviso" da Apresentação: texto do aviso de onde/quando cada
// trabalho será apresentado (backend: emailApresentacao.service.js).
export default function ModeloEmailApresentacao({ edicaoId }) {
  const { notificar } = useToast();
  const [carregado, setCarregado] = useState(null); // { modelo, edicao }
  const [erroCarga, setErroCarga] = useState(false);
  const [assunto, setAssunto] = useState("");
  const [corpo, setCorpo] = useState("");
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [enviandoTeste, setEnviandoTeste] = useState(false);
  const [previsualizando, setPrevisualizando] = useState(false);
  const [confirmandoPadrao, setConfirmandoPadrao] = useState(false);
  const [restaurando, setRestaurando] = useState(false);

  function aplicar(modelo) {
    setCarregado((atual) => ({ ...atual, modelo }));
    setAssunto(modelo.assunto);
    setCorpo(modelo.corpo);
    setErros({});
  }

  useEffect(() => {
    let cancelado = false;
    apiClient
      .get(`/edicoes/${edicaoId}/apresentacao/modelo-email`)
      .then((resposta) => {
        if (cancelado) return;
        setCarregado({ modelo: resposta.modelo, edicao: resposta.edicao });
        setAssunto(resposta.modelo.assunto);
        setCorpo(resposta.modelo.corpo);
      })
      .catch(() => {
        if (!cancelado) setErroCarga(true);
      });
    return () => {
      cancelado = true;
    };
  }, [edicaoId]);

  if (erroCarga) {
    return (
      <div className={styles.vazio}>
        <p>Não foi possível carregar o texto do aviso.</p>
        <p className={styles.vazioApoio}>Recarregue a página para tentar de novo.</p>
      </div>
    );
  }

  if (!carregado) {
    return (
      <div className={styles.vazio} aria-live="polite">
        <p>Carregando...</p>
      </div>
    );
  }

  const { modelo, edicao } = carregado;
  const alterado = assunto !== modelo.assunto || corpo !== modelo.corpo;

  async function copiar(marcador) {
    try {
      await navigator.clipboard.writeText(`{{${marcador}}}`);
      notificar(`Marcador {{${marcador}}} copiado.`);
    } catch {
      notificar("Não foi possível copiar — digite o marcador no texto.", "erro");
    }
  }

  async function salvar() {
    const resultado = modeloEmailApresentacaoSchema.safeParse({ assunto, corpo });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);
    try {
      const resposta = await apiClient.put(`/edicoes/${edicaoId}/apresentacao/modelo-email`, resultado.data);
      aplicar(resposta.modelo);
      notificar(resposta.mensagem);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function restaurarPadrao() {
    setRestaurando(true);
    try {
      const resposta = await apiClient.delete(`/edicoes/${edicaoId}/apresentacao/modelo-email`);
      aplicar(resposta.modelo);
      notificar(resposta.mensagem);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setRestaurando(false);
      setConfirmandoPadrao(false);
    }
  }

  async function enviarTeste() {
    setEnviandoTeste(true);
    try {
      const resposta = await apiClient.post(`/edicoes/${edicaoId}/apresentacao/modelo-email/teste`, {});
      notificar(resposta.mensagem);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setEnviandoTeste(false);
    }
  }

  const exemplo = valoresExemploApresentacao(edicao?.nome);

  return (
    <>
      <section className={estilosResultado.bloco} aria-labelledby="titulo-marcadores-apresentacao">
        <h2 id="titulo-marcadores-apresentacao" className={styles.rotuloBloco}>
          Marcadores
        </h2>
        <p className={styles.textoApoio}>
          Use no assunto ou no texto; cada um é trocado pelo dado do trabalho e do destinatário no envio. Clique
          para copiar.
        </p>
        <ul className={estilosResultado.marcadores}>
          {MARCADORES_EMAIL_APRESENTACAO.map(({ chave, descricao }) => (
            <li key={chave}>
              <button type="button" className={estilosResultado.marcador} onClick={() => copiar(chave)}>
                <code>{`{{${chave}}}`}</code>
                <span>{descricao}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={estilosResultado.cartaoModelo} aria-labelledby="titulo-modelo-apresentacao">
        <div className={estilosResultado.cabecalhoModelo}>
          <h2 id="titulo-modelo-apresentacao" className={estilosResultado.tituloModelo}>
            Aviso de apresentação
          </h2>
          <span className={styles.textoSuave}>{modelo.personalizado ? "Texto personalizado" : "Texto padrão"}</span>
        </div>
        <p className={styles.textoApoio}>
          Vai para cada autor e coautor ao clicar em &quot;Enviar aviso por e-mail&quot;. O botão &quot;Ver a
          atividade&quot; entra sempre no fim do e-mail.
        </p>

        <CampoTexto
          id="modelo-apresentacao-assunto"
          rotulo="Assunto"
          value={assunto}
          onChange={(evento) => setAssunto(evento.target.value)}
          erro={erros.assunto}
        />
        <CampoRichText
          id="modelo-apresentacao-corpo"
          rotulo="Texto do e-mail"
          value={corpo}
          onChange={setCorpo}
          erro={erros.corpo}
        />

        <div className={estilosResultado.acoesModelo}>
          {modelo.personalizado && (
            <Botao type="button" variante="secundario" onClick={() => setConfirmandoPadrao(true)}>
              Voltar ao texto padrão
            </Botao>
          )}
          <Botao type="button" variante="secundario" onClick={() => setPrevisualizando(true)}>
            Pré-visualizar
          </Botao>
          <Botao
            type="button"
            variante="secundario"
            onClick={enviarTeste}
            carregando={enviandoTeste}
            disabled={alterado}
            title={alterado ? "Salve antes de enviar o teste" : undefined}
          >
            Enviar teste para mim
          </Botao>
          <Botao type="button" onClick={salvar} carregando={salvando} disabled={!alterado}>
            Salvar texto
          </Botao>
        </div>
      </section>

      {previsualizando && (
        <Modal titulo="Pré-visualização" onFechar={() => setPrevisualizando(false)}>
          <div className={styles.detalhe}>
            <p className={styles.textoApoio}>Com dados de exemplo.</p>
            <p className={styles.nome}>{preencherEmailApresentacao(assunto, exemplo, { html: false })}</p>
            <ConteudoRichText
              className={styles.corpo}
              html={preencherEmailApresentacao(corpo, exemplo, { html: true })}
              tipo="texto"
            />
            <p className={styles.textoSuave}>+ botão &quot;Ver a atividade&quot;</p>
          </div>
        </Modal>
      )}

      {confirmandoPadrao && (
        <ModalConfirmacao
          titulo="Voltar ao texto padrão"
          mensagem="O texto personalizado do aviso é descartado e o envio volta a usar o texto padrão."
          rotuloConfirmar="Voltar ao padrão"
          perigo
          confirmando={restaurando}
          onConfirmar={restaurarPadrao}
          onCancelar={() => setConfirmandoPadrao(false)}
        />
      )}
    </>
  );
}
