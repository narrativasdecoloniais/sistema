"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
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
  { chave: "nome", rotulo: "Nome", valor: (p) => p.nome },
  { chave: "funcao", rotulo: "Participação", valor: (p) => p.funcao, filtro: "select" },
  { chave: "atividade", rotulo: "Atividade", valor: (p) => p.atividade.nome, filtro: "select" },
  { chave: "email", rotulo: "E-mail", valor: (p) => p.usuario?.email || p.email || null },
  {
    chave: "conta",
    rotulo: "Conta",
    valor: situacaoConta,
    filtro: "select",
    opcoes: opcoesDe(ROTULOS_SITUACAO_CONTA),
    exportar: (p) => ROTULOS_SITUACAO_CONTA[situacaoConta(p)],
  },
];

function ModalConvidado({ edicaoId, convidado, onFechar, onSalvo }) {
  const { notificar } = useToast();
  const [conta, setConta] = useState({ usuario: convidado.usuario || null, email: convidado.email || "" });
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento) {
    evento.preventDefault();
    if (!conta.usuario && conta.email.trim() && !/^\S+@\S+\.\S+$/.test(conta.email.trim())) {
      setErros({ email: "Informe um e-mail válido" });
      return;
    }
    setErros({});
    setSalvando(true);
    try {
      const resposta = await certificadosAdmin.atualizarConvidado(edicaoId, convidado.id, contaOuEmailParaPayload(conta));
      notificar(resposta.mensagem);
      onSalvo();
    } catch (erro) {
      notificar(erro.message, "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={`E-mail de ${convidado.nome}`} onFechar={onFechar}>
      <form className={styles.formulario} onSubmit={salvar} noValidate>
        <p className={styles.textoApoio}>
          {convidado.funcao ? `${convidado.funcao} em ` : "Em "}
          <strong>{convidado.atividade.nome}</strong>. Nome, foto e tipo de participação continuam sendo editados na
          própria atividade.
        </p>
        <CampoContaOuEmail id="convidado" valor={conta} onChange={setConta} erros={erros} />
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

// Aba "Convidados das atividades" de Certificados: todas as pessoas
// envolvidas nas atividades da edição (palestrantes, mediadores…), pra
// completar o e-mail/conta de cada uma sem abrir atividade por atividade.
export default function ConvidadosAtividadesAba({ edicaoId, convidados, recarregar }) {
  const tabela = useTabela(convidados, COLUNAS);
  const [editando, setEditando] = useState(null);

  return (
    <>
      <p className={styles.textoApoio}>
        As pessoas cadastradas nas atividades recebem o certificado &quot;Atuação em atividade&quot;, um por atividade.
        Complete aqui o e-mail ou a conta de cada uma, para o certificado chegar até ela.
      </p>

      {convidados.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhuma pessoa cadastrada nas atividades desta edição.</p>
          <p className={styles.vazioApoio}>Inclua palestrantes, mediadores etc. em &quot;Pessoas envolvidas&quot; de cada atividade.</p>
        </div>
      ) : (
        <div className={styles.tabelaWrapper}>
          <BotaoExportarTabela tabela={tabela} nomeArquivo="convidados-das-atividades" nomeAba="Convidados" />
          <table className={styles.tabela}>
            <CabecalhoTabela tabela={tabela} idTabela="convidados-atividades" classeAcoes={styles.colunaAcoes} />
            <tbody>
              {tabela.linhasVisiveis.length === 0 && <LinhaSemResultado tabela={tabela} colSpan={COLUNAS.length + 1} />}
              {tabela.linhasVisiveis.map((convidado) => (
                <tr key={convidado.id}>
                  <td data-rotulo="Nome">{convidado.nome}</td>
                  <td data-rotulo="Participação">{convidado.funcao || "—"}</td>
                  <td data-rotulo="Atividade">{convidado.atividade.nome}</td>
                  <td data-rotulo="E-mail">{convidado.usuario?.email || convidado.email || "—"}</td>
                  <td data-rotulo="Conta">{ROTULOS_SITUACAO_CONTA[situacaoConta(convidado)]}</td>
                  <td data-rotulo="Ações" className={styles.colunaAcoes}>
                    <div className={styles.acoesLinha}>
                      <button
                        type="button"
                        className={styles.botaoIcone}
                        aria-label={`Editar e-mail de ${convidado.nome}`}
                        title="Editar e-mail"
                        onClick={() => setEditando(convidado)}
                      >
                        <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
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
        <ModalConvidado
          edicaoId={edicaoId}
          convidado={editando}
          onFechar={() => setEditando(null)}
          onSalvo={async () => {
            setEditando(null);
            await recarregar();
          }}
        />
      )}
    </>
  );
}
