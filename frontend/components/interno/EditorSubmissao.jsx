"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CampoRichText from "@/components/forms/CampoRichText";
import CampoTexto from "./CampoTexto";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { conteudoSubmissaoSchema, extrairErros } from "@/lib/validacao";
import { ROTULOS_DECISAO, formatarPrazoCorrecao } from "@/lib/avaliacoes";
import styles from "./EditorSubmissao.module.scss";

const ESPERA_AUTOSAVE_MS = 1500;
const DECISOES_COM_CORRECAO = ["APROVADO_COM_RESSALVAS", "APROVADO_FORMATACAO"];

function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Editor em tela cheia do conteúdo de uma submissão (aberto em nova aba pelo
// botão Editar das tabelas do admin). Salva sozinho ~1,5 s depois da última
// alteração, um salvamento por vez, com concorrência otimista (versaoBase):
// se o trabalho mudou em outra aba/pessoa, o backend responde 409 e o
// autosave para até recarregar. Sucesso não gera toast (seria um por
// salvamento) — o indicador de status na barra faz esse papel; erro gera.
export default function EditorSubmissao({ edicaoId, submissaoInicial }) {
  const { notificar } = useToast();

  const [titulo, setTitulo] = useState(submissaoInicial.titulo);
  const [resumo, setResumo] = useState(submissaoInicial.resumo);
  const [referencia, setReferencia] = useState(submissaoInicial.referenciaBibliografica || "");
  const [status, setStatus] = useState({ tipo: "salvo", texto: "Tudo salvo" });
  const [erros, setErros] = useState({});
  const [conflito, setConflito] = useState(false);

  const base = `/edicoes/${edicaoId}/submissoes/${submissaoInicial.id}`;
  const valoresRef = useRef({ titulo, resumo, referencia });
  const versaoBaseRef = useRef(new Date(submissaoInicial.updatedAt).toISOString());
  const salvandoRef = useRef(false);
  const pendenteRef = useRef(false);
  const temporizadorRef = useRef(null);
  const primeiroRenderRef = useRef(true);
  const conflitoRef = useRef(false);
  const notificarRef = useRef(notificar);

  valoresRef.current = { titulo, resumo, referencia };
  notificarRef.current = notificar;

  // Estável (só depende da URL) — assim o efeito de autosave abaixo só
  // dispara quando o conteúdo muda de verdade.
  const salvar = useCallback(async () => {
    if (conflitoRef.current) return;
    if (salvandoRef.current) {
      // Chegou alteração durante um salvamento — salva de novo ao terminar.
      pendenteRef.current = true;
      return;
    }

    const valores = valoresRef.current;
    const resultado = conteudoSubmissaoSchema.safeParse({
      titulo: valores.titulo,
      resumo: valores.resumo,
      referenciaBibliografica: valores.referencia,
      versaoBase: versaoBaseRef.current,
    });
    if (!resultado.success) {
      setErros(extrairErros(resultado));
      setStatus({ tipo: "invalido", texto: "Não salvo — corrija os campos destacados" });
      return;
    }
    setErros({});

    salvandoRef.current = true;
    pendenteRef.current = false;
    setStatus({ tipo: "salvando", texto: "Salvando..." });

    try {
      const resposta = await apiClient.patch(`${base}/conteudo`, resultado.data);
      versaoBaseRef.current = new Date(resposta.submissao.updatedAt).toISOString();
      setStatus({ tipo: "salvo", texto: `Salvo às ${horaAgora()}` });
    } catch (erro) {
      // Sem nova tentativa automática em erro (evita loop com a API fora do
      // ar): tenta de novo na próxima alteração ou pelo botão da barra.
      pendenteRef.current = false;
      if (erro.status === 409) {
        conflitoRef.current = true;
        setConflito(true);
        setStatus({ tipo: "erro", texto: "Alterado em outra janela" });
      } else {
        setStatus({ tipo: "erro", texto: "Erro ao salvar" });
        notificarRef.current(erro.message, "erro");
      }
    } finally {
      salvandoRef.current = false;
    }

    if (pendenteRef.current) {
      pendenteRef.current = false;
      salvar();
    }
  }, [base]);

  useEffect(() => {
    if (primeiroRenderRef.current) {
      primeiroRenderRef.current = false;
      return undefined;
    }
    if (conflitoRef.current) return undefined;
    setStatus({ tipo: "pendente", texto: "Alterações não salvas..." });
    clearTimeout(temporizadorRef.current);
    temporizadorRef.current = setTimeout(salvar, ESPERA_AUTOSAVE_MS);
    return () => clearTimeout(temporizadorRef.current);
  }, [titulo, resumo, referencia, salvar]);

  // Aviso do navegador ao fechar a aba com alteração ainda não salva.
  useEffect(() => {
    function aoSair(evento) {
      if (status.tipo === "salvo") return;
      evento.preventDefault();
      evento.returnValue = "";
    }
    window.addEventListener("beforeunload", aoSair);
    return () => window.removeEventListener("beforeunload", aoSair);
  }, [status.tipo]);

  const enviarImagem = useCallback(
    async (dataUri) => {
      const resposta = await apiClient.post(`${base}/imagens`, { imagem: dataUri });
      return resposta.url;
    },
    [base]
  );

  function fechar() {
    // Só fecha se a aba foi aberta pelo link "Editar" (window.opener);
    // aberta direto pela URL, o navegador ignoraria o close().
    if (window.opener) window.close();
    else window.history.back();
  }

  const { modalidadeSubmissao, areaSubmissao, decisaoFinal, statusCorrecao, edicao } = submissaoInicial;
  const autorPodeEditar =
    DECISOES_COM_CORRECAO.includes(decisaoFinal) && ["PENDENTE", "DEVOLVIDA"].includes(statusCorrecao);

  return (
    <div className={styles.pagina}>
      <header className={styles.barra}>
        <div className={styles.identificacao}>
          <span className={styles.marca}>Narrativas · Editar trabalho</span>
          <span className={styles.contexto}>
            {modalidadeSubmissao.nome}
            {areaSubmissao?.titulo ? ` · ${areaSubmissao.titulo}` : ""}
            {decisaoFinal ? ` · ${ROTULOS_DECISAO[decisaoFinal]}` : ""}
          </span>
        </div>
        <div className={styles.acoes}>
          <span className={`${styles.status} ${styles[status.tipo] || ""}`} role="status" aria-live="polite">
            {status.texto}
          </span>
          {status.tipo === "erro" && !conflito && (
            <button type="button" className={styles.botaoTexto} onClick={salvar}>
              Tentar de novo
            </button>
          )}
          <button type="button" className={styles.botaoFechar} onClick={fechar}>
            Fechar
          </button>
        </div>
      </header>

      <main className={styles.conteudo}>
        {conflito && (
          <p className={styles.conflito} role="alert">
            Este trabalho foi alterado em outra janela (por você, outro gestor ou pelo autor). O salvamento automático
            foi pausado para não sobrescrever essa alteração. Copie o que precisar do editor abaixo e{" "}
            <button type="button" className={styles.botaoTexto} onClick={() => window.location.reload()}>
              recarregue a página
            </button>
            .
          </p>
        )}

        {autorPodeEditar && (
          <p className={styles.aviso}>
            O autor principal também pode editar este texto até {formatarPrazoCorrecao(edicao.prazoCorrecaoSubmissao)}{" "}
            (correção pedida no resultado). Se ele salvar enquanto você edita, o salvamento automático é pausado.
          </p>
        )}

        <CampoTexto
          id="tituloEditor"
          rotulo="Título"
          value={titulo}
          onChange={(evento) => setTitulo(evento.target.value)}
          erro={erros.titulo}
        />

        <CampoRichText
          id="resumoEditor"
          rotulo="Resumo"
          value={resumo}
          onChange={setResumo}
          erro={erros.resumo}
          permitirImagem
          contarCaracteres
          permitirTabela
          aoEnviarImagem={enviarImagem}
          alto
        />

        <CampoRichText
          id="referenciaEditor"
          rotulo="Referências bibliográficas"
          value={referencia}
          onChange={setReferencia}
          erro={erros.referenciaBibliografica}
          ferramentas={["negrito", "italico", "link"]}
        />
      </main>
    </div>
  );
}
