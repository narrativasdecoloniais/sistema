"use client";

import { useCallback, useEffect, useState } from "react";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import Modal from "./Modal";
import { FormularioModelo } from "./ResultadoModelosEmail";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilosResultado from "./ResultadoSubmissoesPainel.module.scss";

function plural(total, singular, pluralTexto) {
  return `${total} ${total === 1 ? singular : pluralTexto}`;
}

// Envio dos e-mails de resultado, separado da divulgação. Etapas:
// "pergunta" (logo após divulgar) → "revisao" (destinatários + texto de cada
// decisão com prévia dos dados reais; salvar altera o modelo da edição) →
// "confirmacao". O envio roda em segundo plano (resultadoSubmissoes.service.js).
export default function EnviarEmailsResultadoModal({ edicaoId, etapaInicial = "revisao", onFechar, onEnviado }) {
  const { notificar } = useToast();
  const [etapa, setEtapa] = useState(etapaInicial);
  const [previa, setPrevia] = useState(null);
  const [modelos, setModelos] = useState([]);
  const [erroGeral, setErroGeral] = useState("");
  const [soAutorPrincipal, setSoAutorPrincipal] = useState(false);
  const [alterados, setAlterados] = useState({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const base = `/edicoes/${edicaoId}/resultado`;
    Promise.all([apiClient.get(`${base}/previa-emails`), apiClient.get(`${base}/modelos-email`)])
      .then(([dadosPrevia, dadosModelos]) => {
        setPrevia(dadosPrevia?.previa || null);
        setModelos(dadosModelos?.modelos || []);
      })
      .catch((erro) => setErroGeral(erro.message));
  }, [edicaoId]);

  const aoAlterar = useCallback((decisao, alterado) => {
    setAlterados((atual) => (atual[decisao] === alterado ? atual : { ...atual, [decisao]: alterado }));
  }, []);

  const totalEmails = previa ? (soAutorPrincipal ? previa.destinatariosPrincipal : previa.destinatarios) : 0;
  const textoAlterado = Object.values(alterados).some(Boolean);
  const descricaoDestinatarios = soAutorPrincipal ? "o autor principal" : "todos os autores e coautores";

  async function enviar() {
    setEnviando(true);
    try {
      const resposta = await apiClient.post(`/edicoes/${edicaoId}/resultado/enviar-emails`, { soAutorPrincipal });
      notificar(resposta.mensagem);
      onEnviado();
    } catch (erro) {
      setErroGeral(erro.message);
      notificar(erro.message, "erro");
      setEtapa("revisao");
    } finally {
      setEnviando(false);
    }
  }

  let conteudo;
  if (!previa) {
    conteudo = !erroGeral && <p className={styles.textoApoio}>Carregando...</p>;
  } else if (previa.trabalhos === 0) {
    conteudo = (
      <>
        <p className={styles.textoApoio}>Todos os trabalhos já receberam o e-mail de resultado.</p>
        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Fechar
          </Botao>
        </div>
      </>
    );
  } else if (etapa === "pergunta") {
    conteudo = (
      <>
        <p className={styles.textoApoio}>
          O resultado foi divulgado e nenhum e-mail foi enviado. Deseja avisar os autores de{" "}
          {plural(previa.trabalhos, "trabalho", "trabalhos")} por e-mail agora? Antes do envio você revisa os textos e
          escolhe se vão para todos os autores ou só para o autor principal.
        </p>
        <p className={styles.textoApoio}>Dá para enviar depois, pela aba Divulgação.</p>
        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Agora não
          </Botao>
          <Botao type="button" onClick={() => setEtapa("revisao")}>
            Revisar e enviar
          </Botao>
        </div>
      </>
    );
  } else if (etapa === "confirmacao") {
    conteudo = (
      <>
        <p className={styles.textoApoio}>
          <strong>{plural(totalEmails, "e-mail", "e-mails")}</strong> para {descricaoDestinatarios} de{" "}
          {plural(previa.trabalhos, "trabalho", "trabalhos")}. O envio é feito aos poucos, em segundo plano, e o
          progresso aparece na aba Divulgação.
        </p>
        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={() => setEtapa("revisao")} disabled={enviando}>
            Voltar
          </Botao>
          <Botao type="button" onClick={enviar} carregando={enviando}>
            Enviar {plural(totalEmails, "e-mail", "e-mails")}
          </Botao>
        </div>
      </>
    );
  } else {
    conteudo = (
      <>
        <fieldset className={estilosResultado.grupoDestinatarios}>
          <legend>Enviar para</legend>
          <label className={estilosResultado.opcaoDestinatario}>
            <input
              type="radio"
              name="destinatariosResultado"
              checked={!soAutorPrincipal}
              onChange={() => setSoAutorPrincipal(false)}
            />
            <span>
              Todos os autores e coautores{" "}
              <span className={styles.textoSuave}>· {plural(previa.destinatarios, "e-mail", "e-mails")}</span>
            </span>
          </label>
          <label className={estilosResultado.opcaoDestinatario}>
            <input
              type="radio"
              name="destinatariosResultado"
              checked={soAutorPrincipal}
              onChange={() => setSoAutorPrincipal(true)}
            />
            <span>
              Só o autor principal{" "}
              <span className={styles.textoSuave}>· {plural(previa.destinatariosPrincipal, "e-mail", "e-mails")}</span>
            </span>
          </label>
        </fieldset>

        <p className={styles.textoApoio}>
          Revise o texto de cada decisão. Salvar altera o modelo desta edição (o mesmo da aba “Textos dos e-mails”).
          Os marcadores, como o nome, são preenchidos para cada destinatário.
        </p>

        {previa.decisoes.map((item) => {
          const modelo = modelos.find((candidato) => candidato.decisao === item.decisao);
          if (!modelo) return null;
          const emails = soAutorPrincipal ? item.destinatariosPrincipal : item.destinatarios;
          return (
            <FormularioModelo
              key={item.decisao}
              edicaoId={edicaoId}
              modeloInicial={modelo}
              exemplo={item.exemplo}
              descricaoExemplo={`Com os dados de “${item.exemplo.titulo}” (primeiro trabalho desta decisão).`}
              detalhe={`${plural(item.trabalhos, "trabalho", "trabalhos")} · ${plural(emails, "e-mail", "e-mails")}`}
              onAlterado={aoAlterar}
              previaEmbutida
            />
          );
        })}

        {textoAlterado && (
          <p className={styles.aviso}>Salve os textos alterados antes de enviar.</p>
        )}
        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="button" onClick={() => setEtapa("confirmacao")} disabled={textoAlterado || totalEmails === 0}>
            Enviar {plural(totalEmails, "e-mail", "e-mails")}
          </Botao>
        </div>
      </>
    );
  }

  return (
    <Modal titulo="E-mails do resultado" onFechar={onFechar} largo={etapa === "revisao"}>
      <div className={styles.formulario}>
        <Alerta>{erroGeral}</Alerta>
        {conteudo}
      </div>
    </Modal>
  );
}
