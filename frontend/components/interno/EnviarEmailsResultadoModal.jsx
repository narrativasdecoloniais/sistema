"use client";

import { useCallback, useEffect, useState } from "react";
import Botao from "@/components/forms/Botao";
import Alerta from "@/components/forms/Alerta";
import Modal from "./Modal";
import { FormularioModelo } from "./ResultadoModelosEmail";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { ROTULOS_DECISAO } from "@/lib/avaliacoes";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";
import estilosResultado from "./ResultadoSubmissoesPainel.module.scss";

function plural(total, singular, pluralTexto) {
  return `${total} ${total === 1 ? singular : pluralTexto}`;
}

// Envio dos e-mails de resultado, separado da divulgação. Etapas:
// "pergunta" (logo após divulgar) → "revisao" (grupos de decisão,
// destinatários e texto de cada grupo com prévia dos dados reais; salvar
// altera o modelo da edição) → "confirmacao". Só entram os trabalhos que
// ainda não receberam nem foram pedidos; o envio roda em segundo plano
// (resultadoSubmissoes.service.js).
export default function EnviarEmailsResultadoModal({ edicaoId, etapaInicial = "revisao", onFechar, onEnviado }) {
  const { notificar } = useToast();
  const [etapa, setEtapa] = useState(etapaInicial);
  const [previa, setPrevia] = useState(null);
  const [modelos, setModelos] = useState([]);
  const [erroGeral, setErroGeral] = useState("");
  const [soAutorPrincipal, setSoAutorPrincipal] = useState(false);
  // Decisões (grupos) escolhidas para este envio — todas, de início.
  const [escolhidas, setEscolhidas] = useState([]);
  const [alterados, setAlterados] = useState({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const base = `/edicoes/${edicaoId}/resultado`;
    Promise.all([apiClient.get(`${base}/previa-emails`), apiClient.get(`${base}/modelos-email`)])
      .then(([dadosPrevia, dadosModelos]) => {
        setPrevia(dadosPrevia?.previa || null);
        setEscolhidas((dadosPrevia?.previa?.decisoes || []).map((item) => item.decisao));
        setModelos(dadosModelos?.modelos || []);
      })
      .catch((erro) => setErroGeral(erro.message));
  }, [edicaoId]);

  const aoAlterar = useCallback((decisao, alterado) => {
    setAlterados((atual) => (atual[decisao] === alterado ? atual : { ...atual, [decisao]: alterado }));
  }, []);

  const grupos = (previa?.decisoes || []).filter((item) => escolhidas.includes(item.decisao));
  const emailsDoGrupo = (item) => (soAutorPrincipal ? item.destinatariosPrincipal : item.destinatarios);
  const emailsComCpf = (item) => (soAutorPrincipal ? item.destinatariosPrincipalComCpf : item.destinatariosComCpf);
  const totalEmails = grupos.reduce((soma, item) => soma + emailsDoGrupo(item), 0);
  const totalTrabalhos = grupos.reduce((soma, item) => soma + item.trabalhos, 0);
  // Texto não salvo só bloqueia o envio nos grupos escolhidos.
  const textoAlterado = grupos.some((item) => alterados[item.decisao]);
  const descricaoDestinatarios = soAutorPrincipal ? "o autor principal" : "todos os autores e coautores";

  function alternarGrupo(decisao) {
    setEscolhidas((atual) =>
      atual.includes(decisao) ? atual.filter((item) => item !== decisao) : [...atual, decisao]
    );
  }

  async function enviar() {
    setEnviando(true);
    try {
      const resposta = await apiClient.post(`/edicoes/${edicaoId}/resultado/enviar-emails`, {
        decisoes: grupos.map((item) => item.decisao),
        soAutorPrincipal,
      });
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
        <p className={styles.textoApoio}>Todos os trabalhos já receberam o e-mail de resultado ou estão na fila de envio.</p>
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
          {plural(previa.trabalhos, "trabalho", "trabalhos")} por e-mail agora? Antes do envio você escolhe os grupos
          (ex.: só os reprovados), se vão para todos os autores ou só para o autor principal e revisa os textos.
        </p>
        <p className={styles.textoApoio}>Dá para enviar depois, pela aba Divulgação, inclusive um grupo de cada vez.</p>
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
          {plural(totalTrabalhos, "trabalho", "trabalhos")} ({grupos.map((item) => ROTULOS_DECISAO[item.decisao]).join(", ")}).
          O envio é feito aos poucos, em segundo plano, e o progresso aparece na aba Divulgação.
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
          <legend>Grupos</legend>
          {previa.decisoes.map((item) => (
            <label key={item.decisao} className={estilosResultado.opcaoDestinatario}>
              <input
                type="checkbox"
                checked={escolhidas.includes(item.decisao)}
                onChange={() => alternarGrupo(item.decisao)}
              />
              <span>
                {ROTULOS_DECISAO[item.decisao]}{" "}
                <span className={styles.textoSuave}>
                  · {plural(item.trabalhos, "trabalho", "trabalhos")} · {plural(emailsDoGrupo(item), "e-mail", "e-mails")}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

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
              <span className={styles.textoSuave}>
                · {plural(grupos.reduce((soma, item) => soma + item.destinatarios, 0), "e-mail", "e-mails")}
              </span>
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
              <span className={styles.textoSuave}>
                · {plural(grupos.reduce((soma, item) => soma + item.destinatariosPrincipal, 0), "e-mail", "e-mails")}
              </span>
            </span>
          </label>
        </fieldset>

        <p className={styles.textoApoio}>
          Revise o texto de cada grupo escolhido. Salvar altera o modelo desta edição (o mesmo da aba “Textos dos e-mails”).
          Os marcadores, como o nome, são preenchidos para cada destinatário.
        </p>

        {/* Grupos desmarcados ficam montados (escondidos) para não perder texto em edição. */}
        {previa.decisoes.map((item) => {
          const modelo = modelos.find((candidato) => candidato.decisao === item.decisao);
          if (!modelo) return null;
          const emails = emailsDoGrupo(item);
          const comCpf = emailsComCpf(item);
          return (
            <div key={item.decisao} hidden={!escolhidas.includes(item.decisao)}>
              <FormularioModelo
                edicaoId={edicaoId}
                modeloInicial={modelo}
                exemplos={{ comCpf: item.exemploComCpf, semCpf: item.exemploSemCpf }}
                descricaoExemplo={(exemplo) => `Com os dados de “${exemplo.titulo}” (${exemplo.nome}).`}
                detalhe={`${plural(item.trabalhos, "trabalho", "trabalhos")} · ${plural(emails, "e-mail", "e-mails")} (${comCpf} com CPF, ${emails - comCpf} sem)`}
                onAlterado={aoAlterar}
                previaEmbutida
              />
            </div>
          );
        })}

        {textoAlterado && (
          <p className={styles.aviso}>Salve os textos alterados antes de enviar.</p>
        )}
        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao
            type="button"
            onClick={() => setEtapa("confirmacao")}
            disabled={textoAlterado || totalEmails === 0}
            title={grupos.length === 0 ? "Escolha pelo menos um grupo" : undefined}
          >
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
