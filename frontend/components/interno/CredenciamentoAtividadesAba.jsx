"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import PresencaAtividade from "./PresencaAtividade";
import CabecalhoTabela, { LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import { formatarPeriodoAtividade } from "@/lib/publico";
import { credenciamentoAdmin } from "@/lib/credenciamento";
import styles from "./AvaliacaoSubmissoesPainel.module.scss";

const COLUNAS = [
  { chave: "nome", rotulo: "Atividade", valor: (atividade) => atividade.nome },
  {
    chave: "horario",
    rotulo: "Horário",
    valor: (atividade) => new Date(atividade.inicioAtividade).getTime(),
    texto: (atividade) => formatarPeriodoAtividade(atividade.inicioAtividade, atividade.fimAtividade),
  },
  { chave: "local", rotulo: "Local", valor: (atividade) => atividade.local || null },
  { chave: "confirmadas", rotulo: "Confirmadas", valor: (atividade) => atividade.confirmadas },
  { chave: "listaEspera", rotulo: "Lista de espera", valor: (atividade) => atividade.listaEspera },
  { chave: "presentes", rotulo: "Presentes", valor: (atividade) => atividade.presentes },
];

// Atividades que exigem inscrição e a lista de presença de cada uma (com o QR
// code de presença dela). A impressão de todos os QR fica na aba QR codes.
export default function CredenciamentoAtividadesAba({ edicaoId, edicao, atividadesIniciais }) {
  const [atividades, setAtividades] = useState(atividadesIniciais);
  const [abertaId, setAbertaId] = useState(null);
  const tabela = useTabela(atividades, COLUNAS);

  async function recarregarLista() {
    try {
      const dados = await credenciamentoAdmin.listarAtividades(edicaoId);
      setAtividades(dados.atividades);
    } catch {
      // A lista de presença já avisou; os contadores atualizam na próxima carga.
    }
  }

  const aberta = atividades.find((atividade) => atividade.id === abertaId);
  if (aberta) {
    return (
      <PresencaAtividade
        edicaoId={edicaoId}
        edicao={edicao}
        atividadeResumo={aberta}
        aoVoltar={() => {
          setAbertaId(null);
          recarregarLista();
        }}
      />
    );
  }

  if (atividades.length === 0) {
    return (
      <div className={styles.vazio}>
        <p>Nenhuma atividade desta edição exige inscrição.</p>
        <p className={styles.vazioApoio}>Só as atividades com inscrição têm QR code e lista de presença.</p>
      </div>
    );
  }

  return (
    <>
      <p className={styles.textoApoio}>
        Abra a lista de presença para ver os inscritos, registrar presença pela busca e baixar o QR code da atividade.
        No dia, a presença também pode ser lida pelo crachá, no leitor.
      </p>

      <div className={styles.tabelaWrapper}>
        <BotaoExportarTabela tabela={tabela} nomeArquivo="presenca-atividades" nomeAba="Atividades" />
        <table className={styles.tabela}>
          <CabecalhoTabela tabela={tabela} idTabela="credenciamento-atividades" classeAcoes={styles.colunaAcoes} />
          <tbody>
            {tabela.linhasVisiveis.length === 0 && <LinhaSemResultado tabela={tabela} colSpan={COLUNAS.length + 1} />}
            {tabela.linhasVisiveis.map((atividade) => (
              <tr key={atividade.id}>
                <td data-rotulo="Atividade">{atividade.nome}</td>
                <td data-rotulo="Horário">{formatarPeriodoAtividade(atividade.inicioAtividade, atividade.fimAtividade)}</td>
                <td data-rotulo="Local">{atividade.local || "—"}</td>
                <td data-rotulo="Confirmadas">
                  {atividade.confirmadas}
                  {!atividade.semLimiteVagas && atividade.vagas ? ` de ${atividade.vagas}` : ""}
                </td>
                <td data-rotulo="Lista de espera">{atividade.listaEspera}</td>
                <td data-rotulo="Presentes">{atividade.presentes}</td>
                <td data-rotulo="Ações" className={styles.colunaAcoes}>
                  <div className={styles.acoesLinha}>
                    <button
                      type="button"
                      className={styles.botaoIcone}
                      aria-label={`Lista de presença de ${atividade.nome}`}
                      title="Lista de presença"
                      onClick={() => setAbertaId(atividade.id)}
                    >
                      <ClipboardList size={16} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
