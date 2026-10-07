"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Botao from "@/components/forms/Botao";
import CampoRichText from "@/components/forms/CampoRichText";
import CampoTexto from "./CampoTexto";
import { useToast } from "./ToastProvider";
import { buscarMinhaSubmissao, corrigirSubmissao } from "@/lib/participanteSubmissoes";
import { formatarPrazoCorrecao, rotuloDecisaoParticipante } from "@/lib/avaliacoes";
import { correcaoSubmissaoSchema, extrairErros } from "@/lib/validacao";
// Mesma casca (voltar, cabeçalho, aviso, estados vazios) da tela do avaliador.
import styles from "./AvaliacoesParticipante.module.scss";

export default function CorrecaoSubmissaoForm({ submissaoId }) {
  const [submissao, setSubmissao] = useState(null);
  const [erroCarregamento, setErroCarregamento] = useState("");

  useEffect(() => {
    let cancelado = false;
    buscarMinhaSubmissao(submissaoId)
      .then((dados) => {
        if (!cancelado) setSubmissao(dados);
      })
      .catch((falha) => {
        if (!cancelado) setErroCarregamento(falha.message);
      });
    return () => {
      cancelado = true;
    };
  }, [submissaoId]);

  const voltar = (
    <Link href="/participante/submissoes" className={styles.voltar}>
      <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
      Minhas submissões
    </Link>
  );

  if (erroCarregamento || (submissao && !submissao.resultado?.podeCorrigir)) {
    return (
      <div className={styles.pagina}>
        {voltar}
        <div className={styles.vazio}>
          <p>Não há correção pendente para este trabalho.</p>
          <p className={styles.vazioApoio}>
            {erroCarregamento ||
              "A correção só pode ser enviada pelo autor principal, dentro do prazo, quando pedida no resultado."}
          </p>
        </div>
      </div>
    );
  }

  if (!submissao) {
    return (
      <div className={styles.pagina}>
        {voltar}
        <div className={styles.vazio}>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pagina}>
      {voltar}
      <Formulario submissao={submissao} />
    </div>
  );
}

function Formulario({ submissao }) {
  const router = useRouter();
  const { notificar } = useToast();
  const { resultado } = submissao;
  const comRessalvas = resultado.decisao === "APROVADO_COM_RESSALVAS";

  const [titulo, setTitulo] = useState(submissao.titulo);
  const [resumo, setResumo] = useState(submissao.resumo);
  const [referenciaBibliografica, setReferenciaBibliografica] = useState(submissao.referenciaBibliografica);
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    const resultadoValidacao = correcaoSubmissaoSchema.safeParse({
      ...(comRessalvas ? { titulo } : {}),
      resumo,
      referenciaBibliografica,
    });
    if (!resultadoValidacao.success) {
      setErros(extrairErros(resultadoValidacao));
      return;
    }
    setErros({});
    setEnviando(true);
    try {
      await corrigirSubmissao(submissao.id, resultadoValidacao.data);
      notificar(
        comRessalvas
          ? "Correção enviada. A organização vai conferir e você será avisado se precisar de novo ajuste."
          : "Formatação revisada. Obrigado!"
      );
      router.push("/participante/submissoes");
    } catch (erro) {
      notificar(erro.message, "erro");
      setEnviando(false);
    }
  }

  return (
    <>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>{comRessalvas ? "Corrigir trabalho" : "Revisar formatação"}</h1>
          <p className={styles.descricao}>
            {rotuloDecisaoParticipante(resultado.decisao, resultado.statusCorrecao)} · envie até {formatarPrazoCorrecao(resultado.prazoCorrecao)}.
          </p>
        </div>
      </div>

      {resultado.statusCorrecao === "DEVOLVIDA" && resultado.motivoDevolucao ? (
        <p className={styles.aviso}>
          <strong>A organização devolveu a correção anterior:</strong> {resultado.motivoDevolucao}
        </p>
      ) : resultado.observacao ? (
        <p className={styles.aviso}>
          <strong>{comRessalvas ? "O que deve ser ajustado:" : "Observação da organização:"}</strong>{" "}
          {resultado.observacao}
        </p>
      ) : null}

      {!comRessalvas && resultado.statusCorrecao === "CONCLUIDA" && (
        <p className={styles.textoApoio}>
          Você já revisou a formatação deste trabalho. Pode ajustar de novo até{" "}
          {formatarPrazoCorrecao(resultado.prazoCorrecao)}, enquanto os Anais não forem publicados.
        </p>
      )}

      {!comRessalvas && (
        <p className={styles.textoApoio}>
          Confira se o resumo e as referências estão bem formatados para a publicação — parágrafos, negrito, itálico e
          listas. O conteúdo não precisa mudar.
        </p>
      )}

      <form className={styles.formulario} onSubmit={enviar}>
        {comRessalvas && (
          <CampoTexto
            id="tituloCorrecao"
            rotulo="Título"
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
            erro={erros.titulo}
          />
        )}
        <CampoRichText id="resumoCorrecao" rotulo="Resumo" value={resumo} onChange={setResumo} erro={erros.resumo} permitirImagem permitirTabela contarCaracteres />
        <CampoRichText
          id="referenciaCorrecao"
          rotulo="Referência bibliográfica"
          value={referenciaBibliografica}
          onChange={setReferenciaBibliografica}
          erro={erros.referenciaBibliografica}
          ferramentas={["negrito", "italico", "link"]}
        />
        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={() => router.push("/participante/submissoes")}>
            Cancelar
          </Botao>
          <Botao type="submit" carregando={enviando}>
            {comRessalvas ? "Enviar correção" : "Confirmar Revisão"}
          </Botao>
        </div>
      </form>
    </>
  );
}
