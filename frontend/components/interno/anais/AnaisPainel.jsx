"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Globe, GlobeLock } from "lucide-react";
import Botao from "@/components/forms/Botao";
import CartoesContadores from "../CartoesContadores";
import ModalConfirmacao from "../ModalConfirmacao";
import { useToast } from "../ToastProvider";
import { apiClient } from "@/lib/apiClient";
import AnaisConfiguracaoForm from "./AnaisConfiguracaoForm";
import AnaisArtigosAba from "./AnaisArtigosAba";
import AnaisComentariosAba from "./AnaisComentariosAba";
import AnaisArquivosAba from "./AnaisArquivosAba";
import styles from "../AvaliacaoSubmissoesPainel.module.scss";
import estilos from "./AnaisPainel.module.scss";

const INTERVALO_ACOMPANHAMENTO_MS = 3000;

function formatarData(valor) {
  return valor ? new Date(valor).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "";
}

// Tela de Publicação (seção SUBMISSOES_PUBLICACAO): configuração dos Anais
// da edição (ISSN/ISBN, dados editoriais, apresentação), trabalhos
// publicados (ocultar/mostrar), moderação dos comentários e geração dos Anais
// completos em PDF e Word — ver backend/src/services/anais.service.js.
export default function AnaisPainel({ edicaoId, painelInicial, artigosIniciais, comentariosIniciais }) {
  const { notificar } = useToast();
  const [painel, setPainel] = useState(painelInicial);
  const [artigos, setArtigos] = useState(artigosIniciais);
  const [comentarios, setComentarios] = useState(comentariosIniciais);
  const [abaAtiva, setAbaAtiva] = useState(painelInicial?.configurado ? "trabalhos" : "configuracoes");
  const [confirmacao, setConfirmacao] = useState(null);
  const [processando, setProcessando] = useState(false);
  const geracaoAnterior = useRef(painelInicial?.gerando || null);

  const recarregarPainel = useCallback(async () => {
    try {
      const dados = await apiClient.get(`/edicoes/${edicaoId}/anais`);
      setPainel(dados);
      return dados;
    } catch (erro) {
      notificar(erro.message, "erro");
      return null;
    }
  }, [edicaoId, notificar]);

  const recarregarArtigos = useCallback(async () => {
    try {
      const { artigos: lista } = await apiClient.get(`/edicoes/${edicaoId}/anais/artigos`);
      setArtigos(lista);
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }, [edicaoId, notificar]);

  const recarregarComentarios = useCallback(async () => {
    try {
      const { comentarios: lista } = await apiClient.get(`/edicoes/${edicaoId}/anais/comentarios`);
      setComentarios(lista);
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }, [edicaoId, notificar]);

  // Enquanto um arquivo é gerado em segundo plano, consulta o painel até
  // terminar e avisa o resultado.
  useEffect(() => {
    if (!painel?.gerando) return undefined;
    const temporizador = setInterval(recarregarPainel, INTERVALO_ACOMPANHAMENTO_MS);
    return () => clearInterval(temporizador);
  }, [painel?.gerando, recarregarPainel]);

  useEffect(() => {
    const anterior = geracaoAnterior.current;
    geracaoAnterior.current = painel?.gerando || null;
    if (!anterior || painel?.gerando) return;
    const rotulo = anterior === "pdf" ? "PDF" : "Word";
    if (painel?.anais?.erroGeracao) {
      notificar(painel.anais.erroGeracao, "erro");
    } else {
      notificar(`Arquivo ${rotulo} dos Anais gerado.`);
      // O PDF grava as páginas de cada trabalho.
      if (anterior === "pdf") recarregarArtigos();
    }
  }, [painel?.gerando, painel?.anais?.erroGeracao, notificar, recarregarArtigos]);

  if (!painel) {
    return (
      <div className={styles.vazio}>
        <p>Não foi possível carregar os Anais desta edição.</p>
        <p className={styles.vazioApoio}>Recarregue a página para tentar de novo.</p>
      </div>
    );
  }

  const { anais, edicao, contagens } = painel;
  const publicado = Boolean(anais.publicadoEm);
  const urlPublica = edicao.slug ? `/anais/${edicao.slug}` : null;

  function confirmarPublicacao(publicar) {
    setConfirmacao({
      titulo: publicar ? "Publicar os Anais" : "Retirar os Anais do site",
      mensagem: publicar
        ? `Os ${contagens.publicados} trabalhos visíveis ganham página própria no site (com citação e comentários), o menu "Anais" passa a levar para eles e a página entra no sitemap para buscadores. Dá para ocultar trabalhos ou retirar tudo do ar depois.`
        : "As páginas públicas dos Anais e dos trabalhos saem do ar e o menu volta para a seção da página inicial. Configurações, arquivos e comentários são mantidos.",
      rotulo: publicar ? "Publicar" : "Retirar do site",
      perigo: !publicar,
      acao: async () => {
        const resposta = await apiClient.patch(`/edicoes/${edicaoId}/anais/publicacao`, { publicado: publicar });
        await recarregarPainel();
        return resposta;
      },
    });
  }

  async function executarConfirmacao() {
    setProcessando(true);
    try {
      const resposta = await confirmacao.acao();
      if (resposta?.mensagem) notificar(resposta.mensagem);
      setConfirmacao(null);
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessando(false);
    }
  }

  const abas = [
    { chave: "configuracoes", rotulo: "Configurações" },
    { chave: "trabalhos", rotulo: `Trabalhos (${artigos.length})` },
    { chave: "comentarios", rotulo: `Comentários (${comentarios.length})` },
    { chave: "arquivos", rotulo: "PDF e Word" },
  ];

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Anais</h1>
          <p className={styles.descricao}>
            Publique os trabalhos desta edição com página própria, ISSN/ISBN, citação ABNT e comentários, e gere os
            Anais completos em PDF e Word. Entram os trabalhos com decisão final &quot;Aprovado para formatação&quot;.
          </p>
        </div>
        <div className={estilos.acoesCabecalho}>
          <span className={publicado ? styles.tag : estilos.tagNeutra}>
            {publicado ? `Publicado em ${formatarData(anais.publicadoEm)}` : "Não publicado"}
          </span>
          {publicado && urlPublica && (
            <a href={urlPublica} target="_blank" rel="noopener noreferrer" className={estilos.linkPublico}>
              <ExternalLink size={16} strokeWidth={1.5} aria-hidden="true" />
              Ver no site
            </a>
          )}
          {publicado ? (
            <Botao type="button" variante="secundario" onClick={() => confirmarPublicacao(false)}>
              <GlobeLock size={18} strokeWidth={1.5} aria-hidden="true" />
              Retirar do site
            </Botao>
          ) : (
            <Botao
              type="button"
              onClick={() => confirmarPublicacao(true)}
              disabled={!painel.configurado}
              title={painel.configurado ? undefined : "Salve as configurações antes de publicar"}
            >
              <Globe size={18} strokeWidth={1.5} aria-hidden="true" />
              Publicar os Anais
            </Botao>
          )}
        </div>
      </div>

      {!edicao.resultadoDivulgadoEm && (
        <p className={estilos.aviso}>
          O resultado das submissões ainda não foi divulgado — os Anais só podem ser publicados depois disso.
        </p>
      )}
      {!edicao.slug && (
        <p className={estilos.aviso}>
          Esta edição não tem endereço (slug). Defina em Configurações do evento — ele compõe o link dos Anais
          (/anais/slug).
        </p>
      )}

      <CartoesContadores
        itens={[
          { rotulo: "Trabalhos publicados", valor: contagens.publicados },
          { rotulo: "Ocultos", valor: contagens.ocultos },
          { rotulo: "Comentários", valor: contagens.comentarios },
          { rotulo: "Comentários ocultos", valor: contagens.comentariosOcultos },
        ]}
      />

      <div className={styles.abas} role="tablist" aria-label="Seções dos Anais">
        {abas.map((aba) => (
          <button
            key={aba.chave}
            type="button"
            role="tab"
            aria-selected={abaAtiva === aba.chave}
            tabIndex={abaAtiva === aba.chave ? 0 : -1}
            className={`${styles.aba} ${abaAtiva === aba.chave ? styles.abaAtiva : ""}`}
            onClick={() => setAbaAtiva(aba.chave)}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>

      {abaAtiva === "configuracoes" && (
        <AnaisConfiguracaoForm
          edicaoId={edicaoId}
          anais={anais}
          grupos={painel.grupos}
          aoSalvar={async () => {
            await recarregarPainel();
            recarregarArtigos();
          }}
        />
      )}
      {abaAtiva === "trabalhos" && (
        <AnaisArtigosAba
          edicaoId={edicaoId}
          artigos={artigos}
          publicado={publicado}
          aoAlterar={async () => {
            await Promise.all([recarregarArtigos(), recarregarPainel()]);
          }}
        />
      )}
      {abaAtiva === "comentarios" && (
        <AnaisComentariosAba
          edicaoId={edicaoId}
          comentarios={comentarios}
          edicaoSlug={edicao.slug}
          aoAlterar={async () => {
            await Promise.all([recarregarComentarios(), recarregarPainel()]);
          }}
        />
      )}
      {abaAtiva === "arquivos" && (
        <AnaisArquivosAba
          edicaoId={edicaoId}
          anais={anais}
          configurado={painel.configurado}
          gerando={painel.gerando}
          aoIniciar={recarregarPainel}
        />
      )}

      {confirmacao && (
        <ModalConfirmacao
          titulo={confirmacao.titulo}
          mensagem={confirmacao.mensagem}
          rotuloConfirmar={confirmacao.rotulo}
          perigo={confirmacao.perigo}
          confirmando={processando}
          onConfirmar={executarConfirmacao}
          onCancelar={() => setConfirmacao(null)}
        />
      )}
    </div>
  );
}
