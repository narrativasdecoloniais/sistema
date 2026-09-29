"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import CampoSelecao from "./CampoSelecao";
import CampoTexto from "./CampoTexto";
import CampoArea from "./CampoArea";
import { useToast } from "./ToastProvider";
import { formatarIdentificacao } from "@/lib/identificacao";
import {
  ROTULOS_STATUS_MONITORIA,
  buscarUrlAutorizacao,
  dataReferenciaIdade,
  definirStatusMonitoria,
  idadeEm,
} from "@/lib/monitoria";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";

function formatarData(valor) {
  return new Date(valor).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

// Detalhe de uma candidatura para a Coordenação de Monitoria: todos os dados,
// a autorização do responsável (URL assinada, abre em nova aba) e a decisão
// (situação, posição na lista de espera e observação interna).
export default function DetalheInscricaoMonitoriaModal({ edicaoId, edicao, inscricao, onFechar, onAlterada }) {
  const { notificar } = useToast();
  const divulgado = Boolean(edicao.resultadoMonitoriaDivulgadoEm);
  const [status, setStatus] = useState(inscricao.status);
  const [posicao, setPosicao] = useState(inscricao.posicaoListaEspera ? String(inscricao.posicaoListaEspera) : "");
  const [observacao, setObservacao] = useState(inscricao.observacaoCoordenacao || "");
  const [salvando, setSalvando] = useState(false);
  const [abrindoAutorizacao, setAbrindoAutorizacao] = useState(false);

  const idade = idadeEm(inscricao.dataNascimento, dataReferenciaIdade(edicao));
  // Depois da divulgação não dá pra voltar para "em análise".
  const opcoesStatus = Object.entries(ROTULOS_STATUS_MONITORIA).filter(
    ([valor]) => !(divulgado && valor === "EM_ANALISE") || inscricao.status === "EM_ANALISE"
  );

  async function abrirAutorizacao() {
    // A aba abre já no clique (senão o navegador bloqueia como pop-up) e
    // recebe a URL assinada quando ela chega.
    const janela = window.open("", "_blank");
    setAbrindoAutorizacao(true);
    try {
      const { url } = await buscarUrlAutorizacao(edicaoId, inscricao.id);
      if (janela) janela.location.href = url;
      else window.location.href = url;
    } catch (erro) {
      janela?.close();
      notificar(erro.message, "erro");
    } finally {
      setAbrindoAutorizacao(false);
    }
  }

  async function salvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    try {
      const resposta = await definirStatusMonitoria(edicaoId, inscricao.id, {
        status,
        posicaoListaEspera: status === "LISTA_ESPERA" && posicao ? Number(posicao) : null,
        observacaoCoordenacao: observacao,
      });
      notificar(resposta.mensagem);
      await onAlterada();
      onFechar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={inscricao.usuario.nome} onFechar={onFechar}>
      <div className={styles.detalhe}>
        <dl className={styles.metadados}>
          <div>
            <dt>E-mail</dt>
            <dd>{inscricao.usuario.email}</dd>
          </div>
          <div>
            <dt>CPF / Documento</dt>
            <dd>{formatarIdentificacao(inscricao.usuario) || "—"}</dd>
          </div>
          <div>
            <dt>Nascimento</dt>
            <dd>
              {formatarData(inscricao.dataNascimento)} ({idade} anos no evento)
            </dd>
          </div>
          <div>
            <dt>Pronome</dt>
            <dd>{inscricao.pronome}</dd>
          </div>
          <div>
            <dt>Telefone</dt>
            <dd>{inscricao.telefone}</dd>
          </div>
          <div>
            <dt>Experiência anterior</dt>
            <dd>{inscricao.experienciaAnterior ? "Sim" : "Não"}</dd>
          </div>
        </dl>

        <div className={styles.blocoDetalhe}>
          <p className={styles.rotuloBloco}>Curso e instituição</p>
          <p className={styles.corpo}>{inscricao.cursoInstituicao}</p>
        </div>

        <div className={styles.blocoDetalhe}>
          <p className={styles.rotuloBloco}>Atividades de interesse</p>
          <ul className={styles.corpo}>
            {inscricao.funcoes.map((funcao) => (
              <li key={funcao}>{funcao}</li>
            ))}
          </ul>
        </div>

        <div className={styles.blocoDetalhe}>
          <p className={styles.rotuloBloco}>Adaptações ou recursos</p>
          <p className={styles.corpo}>
            {inscricao.precisaAdaptacao ? inscricao.adaptacoesNecessarias : "Não necessita."}
          </p>
        </div>

        {idade < 18 && (
          <div className={styles.blocoDetalhe}>
            <p className={styles.rotuloBloco}>Autorização do(a) responsável</p>
            {inscricao.temAutorizacao ? (
              <div>
                <Botao type="button" variante="secundario" carregando={abrindoAutorizacao} onClick={abrirAutorizacao}>
                  <FileText size={18} strokeWidth={1.5} aria-hidden="true" />
                  Abrir autorização
                </Botao>
              </div>
            ) : (
              <p className={styles.aviso}>Menor de 18 anos sem autorização anexada.</p>
            )}
          </div>
        )}

        <form className={styles.formulario} onSubmit={salvar} noValidate>
          <CampoSelecao
            id="statusMonitoria"
            rotulo="Situação"
            value={status}
            onChange={(evento) => setStatus(evento.target.value)}
          >
            {opcoesStatus.map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </CampoSelecao>
          {status === "LISTA_ESPERA" && (
            <CampoTexto
              id="posicaoListaEspera"
              rotulo="Posição na lista de espera (vazio = próxima livre)"
              type="number"
              min={1}
              value={posicao}
              onChange={(evento) => setPosicao(evento.target.value)}
            />
          )}
          <CampoArea
            id="observacaoCoordenacao"
            rotulo="Observação interna (não é mostrada ao candidato)"
            linhas={3}
            maxLength={2000}
            value={observacao}
            onChange={(evento) => setObservacao(evento.target.value)}
          />
          {divulgado && status !== inscricao.status && (
            <p className={styles.aviso}>
              O resultado já foi divulgado: ao salvar, o e-mail desta pessoa fica pendente com a nova situação.
            </p>
          )}
          <div className={styles.acoesFormulario}>
            <Botao type="button" variante="secundario" onClick={onFechar}>
              Cancelar
            </Botao>
            <Botao type="submit" carregando={salvando}>
              Salvar
            </Botao>
          </div>
        </form>
      </div>
    </Modal>
  );
}
