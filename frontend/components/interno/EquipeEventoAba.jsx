"use client";

import { useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import ModalConfirmacao from "./ModalConfirmacao";
import CampoTexto from "./CampoTexto";
import CampoNumero from "./CampoNumero";
import CampoContaOuEmail, {
  ROTULOS_SITUACAO_CONTA,
  contaOuEmailParaPayload,
  situacaoConta,
} from "./CampoContaOuEmail";
import CabecalhoTabela, { LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import { useToast } from "./ToastProvider";
import { certificadosAdmin } from "@/lib/certificados";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";

const opcoesDe = (rotulos) => Object.entries(rotulos).map(([valor, rotulo]) => ({ valor, rotulo }));

const COLUNAS = [
  { chave: "nome", rotulo: "Nome", valor: (m) => m.nome },
  { chave: "funcao", rotulo: "Função", valor: (m) => m.funcao, filtro: "select" },
  { chave: "email", rotulo: "E-mail", valor: (m) => m.usuario?.email || m.email || null },
  {
    chave: "conta",
    rotulo: "Conta",
    valor: situacaoConta,
    filtro: "select",
    opcoes: opcoesDe(ROTULOS_SITUACAO_CONTA),
    exportar: (m) => ROTULOS_SITUACAO_CONTA[situacaoConta(m)],
  },
  {
    chave: "carga",
    rotulo: "Carga horária",
    valor: (m) => m.cargaHoraria ?? null,
    exportar: (m) => (m.cargaHoraria != null ? `${m.cargaHoraria} h` : ""),
  },
  {
    chave: "certificado",
    rotulo: "Certificado",
    valor: (m) => (m._count.certificados > 0 ? "Emitido" : "Não emitido"),
    filtro: "select",
  },
];

function ModalMembro({ edicaoId, membro, funcoes, onFechar, onSalvo }) {
  const { notificar } = useToast();
  const [nome, setNome] = useState(membro?.nome || "");
  const [funcao, setFuncao] = useState(membro?.funcao || "");
  const [cargaHoraria, setCargaHoraria] = useState(membro?.cargaHoraria ?? null);
  const [conta, setConta] = useState({ usuario: membro?.usuario || null, email: membro?.email || "" });
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento) {
    evento.preventDefault();
    const novos = {};
    if (nome.trim().length < 2) novos.nome = "Informe o nome";
    if (funcao.trim().length < 2) novos.funcao = "Informe a função (ex. Comissão Organizadora)";
    if (!conta.usuario && conta.email.trim() && !/^\S+@\S+\.\S+$/.test(conta.email.trim())) {
      novos.email = "Informe um e-mail válido";
    }
    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    setSalvando(true);
    try {
      const resposta = await certificadosAdmin.salvarMembroEquipe(edicaoId, membro?.id, {
        nome: nome.trim(),
        funcao: funcao.trim(),
        cargaHoraria: cargaHoraria ?? null,
        ...contaOuEmailParaPayload(conta),
      });
      notificar(resposta.mensagem);
      onSalvo();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={membro ? "Editar membro da equipe" : "Adicionar membro da equipe"} onFechar={onFechar}>
      <form className={styles.formulario} onSubmit={salvar} noValidate>
        <CampoTexto id="membro-nome" rotulo="Nome (como sai no certificado)" value={nome} onChange={(e) => setNome(e.target.value)} erro={erros.nome} />
        <CampoTexto
          id="membro-funcao"
          rotulo="Função"
          value={funcao}
          list="membro-funcoes"
          placeholder="Ex.: Comissão Organizadora"
          onChange={(e) => setFuncao(e.target.value)}
          erro={erros.funcao}
        />
        <datalist id="membro-funcoes">
          {funcoes.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <CampoNumero
          id="membro-carga"
          rotulo="Carga horária (opcional)"
          value={cargaHoraria}
          min={1}
          onValueChange={(e) => setCargaHoraria(e.value ?? null)}
        />
        <CampoContaOuEmail id="membro" valor={conta} onChange={setConta} erros={erros} />
        <div className={styles.acoesFormulario}>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao type="submit" carregando={salvando}>
            Salvar
          </Botao>
        </div>
      </form>
    </Modal>
  );
}

// Aba "Equipe do evento" de Certificados: quem recebe o certificado de equipe
// (comissões, coordenação…) nesta edição. Independente da dobra "Comissões e
// Programas" da home.
export default function EquipeEventoAba({ edicaoId, equipe, recarregar }) {
  const { notificar } = useToast();
  const tabela = useTabela(equipe, COLUNAS);
  const [editando, setEditando] = useState(null); // null | "novo" | membro
  const [excluindo, setExcluindo] = useState(null);
  const [processando, setProcessando] = useState(false);

  const funcoes = [...new Set(equipe.map((m) => m.funcao))].sort((a, b) => a.localeCompare(b));

  async function excluir() {
    setProcessando(true);
    try {
      const resposta = await certificadosAdmin.excluirMembroEquipe(edicaoId, excluindo.id);
      notificar(resposta.mensagem);
      await recarregar();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setProcessando(false);
      setExcluindo(null);
    }
  }

  return (
    <>
      <div className={styles.barraAcoes}>
        <p className={styles.textoApoio}>
          Quem recebe o certificado &quot;Equipe do evento&quot;. Depois de incluir, use &quot;Gerar&quot; nesse tipo, na
          aba Emitidos.
        </p>
        <Botao type="button" onClick={() => setEditando("novo")}>
          <UserPlus size={18} strokeWidth={1.5} aria-hidden="true" />
          Adicionar membro
        </Botao>
      </div>

      {equipe.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum membro da equipe cadastrado.</p>
          <p className={styles.vazioApoio}>Adicione as pessoas das comissões e da coordenação do evento.</p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <BotaoExportarTabela tabela={tabela} nomeArquivo="equipe-do-evento" nomeAba="Equipe do evento" />
          <table className={styles.tabela}>
            <CabecalhoTabela tabela={tabela} idTabela="equipe-evento" classeAcoes={styles.colunaAcoes} />
            <tbody>
              {tabela.linhasVisiveis.length === 0 && <LinhaSemResultado tabela={tabela} colSpan={COLUNAS.length + 1} />}
              {tabela.linhasVisiveis.map((membro) => (
                <tr key={membro.id}>
                  <td data-rotulo="Nome">{membro.nome}</td>
                  <td data-rotulo="Função">{membro.funcao}</td>
                  <td data-rotulo="E-mail">{membro.usuario?.email || membro.email || "—"}</td>
                  <td data-rotulo="Conta">{ROTULOS_SITUACAO_CONTA[situacaoConta(membro)]}</td>
                  <td data-rotulo="Carga horária">{membro.cargaHoraria != null ? `${membro.cargaHoraria} h` : "—"}</td>
                  <td data-rotulo="Certificado">{membro._count.certificados > 0 ? "Emitido" : "Não emitido"}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      <button
                        type="button"
                        className={styles.botaoIcone}
                        aria-label={`Editar ${membro.nome}`}
                        title="Editar"
                        onClick={() => setEditando(membro)}
                      >
                        <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`${styles.botaoIcone} ${styles.botaoIconePerigo}`}
                        aria-label={`Remover ${membro.nome} da equipe`}
                        title="Remover"
                        onClick={() => setExcluindo(membro)}
                      >
                        <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <ModalMembro
          edicaoId={edicaoId}
          membro={editando === "novo" ? null : editando}
          funcoes={funcoes}
          onFechar={() => setEditando(null)}
          onSalvo={async () => {
            setEditando(null);
            await recarregar();
          }}
        />
      )}

      {excluindo && (
        <ModalConfirmacao
          titulo="Remover da equipe"
          mensagem={`Remover ${excluindo.nome} (${excluindo.funcao}) da equipe do evento? Quem já tem certificado emitido precisa ter o certificado revogado antes.`}
          rotuloConfirmar="Remover"
          confirmando={processando}
          onConfirmar={excluir}
          onCancelar={() => setExcluindo(null)}
        />
      )}
    </>
  );
}
