"use client";

import { useState } from "react";
import Botao from "@/components/forms/Botao";
import CampoRichText from "@/components/forms/CampoRichText";
import Modal from "./Modal";
import CampoTexto from "./CampoTexto";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { ROTULOS_DECISAO } from "@/lib/avaliacoes";
import { modeloEmailResultadoSchema, extrairErros } from "@/lib/validacao";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilosResultado from "./ResultadoSubmissoesPainel.module.scss";

const DESCRICOES_MARCADORES = {
  nome: "nome do autor",
  titulo: "título do trabalho",
  modalidade: "modalidade",
  area: "área temática",
  edicao: "nome da edição",
  observacao: "observação da organização para o trabalho",
  prazo: "prazo de correção",
  link: "link para Minhas submissões",
};

// Mesmos dados de exemplo do "Enviar teste para mim" (emailResultado.service.js).
const EXEMPLO = {
  nome: "Maria da Silva",
  titulo: "Título de exemplo do trabalho",
  modalidade: "Modalidade de exemplo",
  area: "Área de exemplo",
  edicao: "Edição de exemplo",
  observacao: "Observação de exemplo escrita pela organização para este trabalho.",
  prazo: "31/12/2026",
  link: "https://exemplo/participante/submissoes",
};

function escapar(texto) {
  return String(texto).replace(
    /[&<>"']/g,
    (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[caractere]
  );
}

// Espelha renderizar() do backend, só para a pré-visualização.
function preencher(texto, { html }) {
  return texto.replace(/\{\{\s*(\w+)\s*\}\}/g, (original, chave) =>
    chave in EXEMPLO ? (html ? escapar(EXEMPLO[chave]) : EXEMPLO[chave]) : original
  );
}

export default function AbaModelosEmail({ edicaoId, modelosIniciais, marcadores }) {
  const { notificar } = useToast();

  async function copiarMarcador(marcador) {
    try {
      await navigator.clipboard.writeText(`{{${marcador}}}`);
      notificar(`Marcador {{${marcador}}} copiado.`);
    } catch {
      notificar("Não foi possível copiar — digite o marcador no texto.", "erro");
    }
  }

  return (
    <>
      <section className={estilosResultado.bloco} aria-labelledby="titulo-marcadores">
        <h2 id="titulo-marcadores" className={styles.rotuloBloco}>
          Marcadores
        </h2>
        <p className={styles.textoApoio}>
          Use no assunto ou no texto; cada um é trocado pelo dado do trabalho no envio. Clique para copiar.
        </p>
        <ul className={estilosResultado.marcadores}>
          {marcadores.map((marcador) => (
            <li key={marcador}>
              <button type="button" className={estilosResultado.marcador} onClick={() => copiarMarcador(marcador)}>
                <code>{`{{${marcador}}}`}</code>
                <span>{DESCRICOES_MARCADORES[marcador]}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {modelosIniciais.map((modelo) => (
        <FormularioModelo key={modelo.decisao} edicaoId={edicaoId} modeloInicial={modelo} />
      ))}
    </>
  );
}

function FormularioModelo({ edicaoId, modeloInicial }) {
  const { notificar } = useToast();
  const [assunto, setAssunto] = useState(modeloInicial.assunto);
  const [corpo, setCorpo] = useState(modeloInicial.corpo);
  const [salvo, setSalvo] = useState(modeloInicial);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [enviandoTeste, setEnviandoTeste] = useState(false);
  const [previsualizando, setPrevisualizando] = useState(false);

  const idBase = `modelo-${modeloInicial.decisao}`;
  const alterado = assunto !== salvo.assunto || corpo !== salvo.corpo;

  async function salvar() {
    const resultado = modeloEmailResultadoSchema.safeParse({ assunto, corpo });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      return;
    }
    setErros({});
    setSalvando(true);
    try {
      const resposta = await apiClient.patch(
        `/edicoes/${edicaoId}/resultado/modelos-email/${modeloInicial.decisao}`,
        resultado.data
      );
      setSalvo(resposta.modelo);
      setCorpo(resposta.modelo.corpo);
      notificar(`Texto de "${ROTULOS_DECISAO[modeloInicial.decisao]}" salvo.`);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  async function enviarTeste() {
    setEnviandoTeste(true);
    try {
      const resposta = await apiClient.post(
        `/edicoes/${edicaoId}/resultado/modelos-email/${modeloInicial.decisao}/teste`,
        {}
      );
      notificar(resposta.mensagem);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setEnviandoTeste(false);
    }
  }

  return (
    <section className={estilosResultado.cartaoModelo} aria-labelledby={`${idBase}-titulo`}>
      <div className={estilosResultado.cabecalhoModelo}>
        <h2 id={`${idBase}-titulo`} className={estilosResultado.tituloModelo}>
          {ROTULOS_DECISAO[modeloInicial.decisao]}
        </h2>
        <span className={styles.textoSuave}>{salvo.personalizado ? "Texto personalizado" : "Texto padrão"}</span>
      </div>

      <CampoTexto
        id={`${idBase}-assunto`}
        rotulo="Assunto"
        value={assunto}
        onChange={(evento) => setAssunto(evento.target.value)}
        erro={erros.assunto}
      />
      <CampoRichText id={`${idBase}-corpo`} rotulo="Texto do e-mail" value={corpo} onChange={setCorpo} erro={erros.corpo} />

      <div className={estilosResultado.acoesModelo}>
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

      {previsualizando && (
        <Modal titulo="Pré-visualização" onFechar={() => setPrevisualizando(false)}>
          <div className={styles.detalhe}>
            <p className={styles.textoApoio}>Com dados de exemplo.</p>
            <p className={styles.nome}>{preencher(assunto, { html: false })}</p>
            {/* Texto do próprio editor (TipTap), sanitizado de novo no backend ao salvar. */}
            <div className={styles.corpo} dangerouslySetInnerHTML={{ __html: preencher(corpo, { html: true }) }} />
          </div>
        </Modal>
      )}
    </section>
  );
}
