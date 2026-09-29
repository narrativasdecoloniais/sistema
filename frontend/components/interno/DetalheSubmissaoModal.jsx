"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Botao from "@/components/forms/Botao";
import ConteudoRichText from "@/components/ConteudoRichText";
import Modal from "./Modal";
import CampoSelecao from "./CampoSelecao";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { areaSubmissaoAdminSchema, extrairErros } from "@/lib/validacao";
import styles from "./SubmissoesRecebimentoPainel.module.scss";

function formatarData(valor) {
  return new Date(valor).toLocaleDateString("pt-BR", { dateStyle: "short" });
}

// Detalhe de uma submissão com troca de área — compartilhado pelas telas de
// Recebimento e Apresentação. `submissao` precisa trazer modalidade, área,
// autores, resumo, referência e createdAt; `modalidades` traz as áreas de
// cada modalidade (só as da mesma modalidade podem ser escolhidas).
export default function DetalheSubmissaoModal({ edicaoId, submissao, modalidades, onFechar, onAlterada, children }) {
  const areas =
    modalidades.find((modalidade) => modalidade.id === submissao.modalidadeSubmissao.id)?.areas || [];

  return (
    <Modal titulo={submissao.titulo} onFechar={onFechar}>
      <div className={styles.detalhe}>
        <dl className={styles.metadados}>
          <div>
            <dt>Modalidade</dt>
            <dd>{submissao.modalidadeSubmissao.nome}</dd>
          </div>
          {submissao.createdAt && (
            <div>
              <dt>Enviado em</dt>
              <dd>{formatarData(submissao.createdAt)}</dd>
            </div>
          )}
        </dl>

        <AlterarArea
          key={submissao.id}
          edicaoId={edicaoId}
          submissao={submissao}
          areas={areas}
          onAlterada={onAlterada}
        />

        {children}

        <div className={styles.blocoDetalhe}>
          <span className={styles.rotuloBloco}>Autores</span>
          <ul className={styles.listaAutores}>
            {submissao.autores.map((autor) => (
              <li key={autor.id}>
                <span className={styles.autorNome}>{autor.nome}</span>
                {autor.principal && <span className={styles.tag}>Principal</span>}
                <span className={styles.autorEmail}>{autor.email}</span>
                {autor.orcid && <span className={styles.autorOrcid}>ORCID: {autor.orcid}</span>}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.blocoDetalhe}>
          <span className={styles.rotuloBloco}>Resumo</span>
          <ConteudoRichText className={styles.corpo} html={submissao.resumo} tipo="resumo" />
        </div>

        <div className={styles.blocoDetalhe}>
          <span className={styles.rotuloBloco}>Referência bibliográfica</span>
          <ConteudoRichText className={styles.corpo} html={submissao.referenciaBibliografica} tipo="referencia" />
        </div>
      </div>
    </Modal>
  );
}

// Correção de enquadramento: só áreas da mesma modalidade. Sem decisão final,
// o backend redistribui a avaliação para os avaliadores da nova área.
function AlterarArea({ edicaoId, submissao, areas, onAlterada }) {
  const router = useRouter();
  const { notificar } = useToast();
  const [areaId, setAreaId] = useState(submissao.areaSubmissao?.id || "");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const alterada = areaId !== (submissao.areaSubmissao?.id || "");

  async function salvar() {
    const resultado = areaSubmissaoAdminSchema.safeParse({ areaSubmissaoId: areaId });
    if (!resultado.success) {
      setErro(extrairErros(resultado).areaSubmissaoId);
      return;
    }

    setErro("");
    setSalvando(true);
    try {
      const resposta = await apiClient.patch(`/edicoes/${edicaoId}/submissoes/${submissao.id}/area`, resultado.data);
      await onAlterada?.(resposta.submissao);
      notificar("Área alterada com sucesso.");
      router.refresh();
    } catch (erroApi) {
      notificar(erroApi.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={styles.alterarArea}>
      <CampoSelecao
        id={`area-${submissao.id}`}
        rotulo="Área"
        value={areaId}
        erro={erro}
        onChange={(evento) => setAreaId(evento.target.value)}
      >
        {!submissao.areaSubmissao && <option value="">Sem área</option>}
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.titulo}
          </option>
        ))}
      </CampoSelecao>
      {alterada && (
        <>
          <p className={styles.avisoArea}>
            {submissao.decisaoFinal
              ? "O trabalho já tem decisão final — só a área muda, as avaliações registradas ficam como estão."
              : "As atribuições de avaliação atuais serão descartadas e o trabalho vai para os avaliadores da nova área."}
          </p>
          <div className={styles.acoesArea}>
            <Botao type="button" variante="secundario" onClick={() => setAreaId(submissao.areaSubmissao?.id || "")}>
              Cancelar
            </Botao>
            <Botao type="button" onClick={salvar} carregando={salvando}>
              Salvar área
            </Botao>
          </div>
        </>
      )}
    </div>
  );
}
