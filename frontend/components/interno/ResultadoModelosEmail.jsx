"use client";

import { useEffect, useState } from "react";
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
import ConteudoRichText from "@/components/ConteudoRichText";
import { EXEMPLO_EMAIL_RESULTADO, preencherModeloResultado } from "@/lib/emailResultado";

const DESCRICOES_MARCADORES = {
  nome: "nome do autor",
  email: "e-mail do destinatário",
  titulo: "título do trabalho",
  modalidade: "modalidade",
  area: "área temática",
  edicao: "nome da edição",
  observacao: "observação da organização para o trabalho",
  prazo: "prazo de correção",
  link: "link para Minhas submissões",
};

const TRECHOS_CONDICIONAIS = [
  { bloco: "comCpf", descricao: "só para quem já tem CPF/documento na conta" },
  { bloco: "semCpf", descricao: "só para quem ainda não tem (conta do Even3 ou sem conta)" },
];

// Mostra a alternância da prévia só quando o texto usa trechos condicionais.
const USA_TRECHOS = /\{\{\s*#\s*(comCpf|semCpf)\s*\}\}/;

export default function AbaModelosEmail({ edicaoId, modelosIniciais, marcadores }) {
  const { notificar } = useToast();

  async function copiar(texto, mensagem) {
    try {
      await navigator.clipboard.writeText(texto);
      notificar(mensagem);
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
              <button
                type="button"
                className={estilosResultado.marcador}
                onClick={() => copiar(`{{${marcador}}}`, `Marcador {{${marcador}}} copiado.`)}
              >
                <code>{`{{${marcador}}}`}</code>
                <span>{DESCRICOES_MARCADORES[marcador]}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={estilosResultado.bloco} aria-labelledby="titulo-trechos">
        <h2 id="titulo-trechos" className={styles.rotuloBloco}>
          Trechos condicionais
        </h2>
        <p className={styles.textoApoio}>
          O que estiver entre a abertura e o fechamento só vai para parte dos destinatários. Podem cobrir vários
          parágrafos e também valem no assunto. Clique para copiar o par e escreva o texto no meio.
        </p>
        <ul className={estilosResultado.marcadores}>
          {TRECHOS_CONDICIONAIS.map(({ bloco, descricao }) => (
            <li key={bloco}>
              <button
                type="button"
                className={estilosResultado.marcador}
                onClick={() => copiar(`{{#${bloco}}} {{/${bloco}}}`, `Trecho {{#${bloco}}} copiado.`)}
              >
                <code>{`{{#${bloco}}} … {{/${bloco}}}`}</code>
                <span>{descricao}</span>
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

// Também usado no EnviarEmailsResultadoModal, com os dados reais de um
// destinatário de cada versão (exemplos.comCpf/semCpf, null quando o grupo não
// tem ninguém naquela situação; descricaoExemplo recebe o exemplo exibido), a
// contagem do envio (detalhe) e onAlterado para bloquear o envio com texto
// ainda não salvo.
export function FormularioModelo({
  edicaoId,
  modeloInicial,
  exemplos,
  descricaoExemplo = () => "Com dados de exemplo.",
  detalhe,
  onAlterado,
  previaEmbutida = false,
}) {
  const { notificar } = useToast();
  const [assunto, setAssunto] = useState(modeloInicial.assunto);
  const [corpo, setCorpo] = useState(modeloInicial.corpo);
  const [salvo, setSalvo] = useState(modeloInicial);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [enviandoTeste, setEnviandoTeste] = useState(false);
  const [previsualizando, setPrevisualizando] = useState(false);
  const [versao, setVersao] = useState("comCpf");

  const idBase = `modelo-${modeloInicial.decisao}`;
  const alterado = assunto !== salvo.assunto || corpo !== salvo.corpo;

  useEffect(() => {
    onAlterado?.(modeloInicial.decisao, alterado);
  }, [alterado, modeloInicial.decisao, onAlterado]);

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
        { comCpf: !usaTrechos || versao === "comCpf" }
      );
      notificar(resposta.mensagem);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setEnviandoTeste(false);
    }
  }

  const usaTrechos = USA_TRECHOS.test(assunto) || USA_TRECHOS.test(corpo);
  const comCpf = !usaTrechos || versao === "comCpf";
  // Sem trechos no texto, qualquer destinatário real serve de exemplo.
  const exemploReal = exemplos
    ? usaTrechos
      ? exemplos[comCpf ? "comCpf" : "semCpf"]
      : exemplos.comCpf || exemplos.semCpf
    : null;
  const exemplo = exemploReal || { ...EXEMPLO_EMAIL_RESULTADO, comCpf };

  // Embutida quando o formulário já está dentro de um modal (um Modal dentro
  // de outro fecharia os dois no Esc).
  const previa = (
    <div className={`${styles.detalhe} ${previaEmbutida ? estilosResultado.previaEmbutida : ""}`}>
      {usaTrechos && (
        <div className={estilosResultado.versoesPrevia} role="group" aria-label="Ver a pré-visualização como">
          <span className={styles.textoSuave}>Ver como:</span>
          {[
            ["comCpf", "Com CPF"],
            ["semCpf", "Sem CPF"],
          ].map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={versao === valor}
              className={`${estilosResultado.marcador} ${versao === valor ? estilosResultado.versaoAtiva : ""}`}
              onClick={() => setVersao(valor)}
            >
              {rotulo}
            </button>
          ))}
        </div>
      )}
      <p className={styles.textoApoio}>
        {exemplos && !exemploReal
          ? `Nenhum destinatário deste grupo está ${comCpf ? "com" : "sem"} CPF — com dados de exemplo.`
          : descricaoExemplo(exemplo)}
      </p>
      <p className={styles.nome}>{preencherModeloResultado(assunto, exemplo, { html: false })}</p>
      <ConteudoRichText
        className={styles.corpo}
        html={preencherModeloResultado(corpo, exemplo, { html: true })}
        tipo="texto"
      />
    </div>
  );

  return (
    <section className={estilosResultado.cartaoModelo} aria-labelledby={`${idBase}-titulo`}>
      <div className={estilosResultado.cabecalhoModelo}>
        <h2 id={`${idBase}-titulo`} className={estilosResultado.tituloModelo}>
          {ROTULOS_DECISAO[modeloInicial.decisao]}
        </h2>
        <span className={styles.textoSuave}>
          {detalhe ? `${detalhe} · ` : ""}
          {salvo.personalizado ? "Texto personalizado" : "Texto padrão"}
        </span>
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
        <Botao type="button" variante="secundario" onClick={() => setPrevisualizando((atual) => !atual)}>
          {previaEmbutida && previsualizando ? "Ocultar pré-visualização" : "Pré-visualizar"}
        </Botao>
        <Botao
          type="button"
          variante="secundario"
          onClick={enviarTeste}
          carregando={enviandoTeste}
          disabled={alterado}
          title={alterado ? "Salve antes de enviar o teste" : undefined}
        >
          {usaTrechos ? `Enviar teste (${comCpf ? "com" : "sem"} CPF)` : "Enviar teste para mim"}
        </Botao>
        <Botao type="button" onClick={salvar} carregando={salvando} disabled={!alterado}>
          Salvar texto
        </Botao>
      </div>

      {previsualizando &&
        (previaEmbutida ? (
          previa
        ) : (
          <Modal titulo="Pré-visualização" onFechar={() => setPrevisualizando(false)}>
            {previa}
          </Modal>
        ))}
    </section>
  );
}
