"use client";

import { useState } from "react";
import { ClipboardList, Download, Printer } from "lucide-react";
import Botao from "@/components/forms/Botao";
import PresencaAtividade from "./PresencaAtividade";
import CabecalhoTabela, { LinhaSemResultado } from "./CabecalhoTabela";
import BotaoExportarTabela from "./BotaoExportarTabela";
import useTabela from "./useTabela";
import { useToast } from "./ToastProvider";
import { formatarPeriodoAtividade } from "@/lib/publico";
import { baixarQrPng, credenciamentoAdmin, imprimirQrCodes } from "@/lib/credenciamento";
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

// Atividades que exigem inscrição: cada uma tem QR code de presença (válido
// de 30 min antes do início até o fim, horário de Brasília) e lista de presença.
export default function CredenciamentoAtividadesAba({ edicaoId, edicao, atividadesIniciais }) {
  const { notificar } = useToast();
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

  async function comTratamento(acao) {
    try {
      await acao();
    } catch (erro) {
      notificar(erro.message, "erro");
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
        O QR code de cada atividade funciona de 30 minutos antes do início até o fim, no horário de Brasília. Quem lê
        sem estar inscrito é inscrito na hora (sem vaga, vai para a lista de espera e precisa ser validado aqui).
      </p>
      <div>
        <Botao
          type="button"
          variante="secundario"
          onClick={() =>
            comTratamento(() =>
              imprimirQrCodes(async () => (await credenciamentoAdmin.qrTodasAtividades(edicaoId)).qrs, { evento: edicao.nome })
            )
          }
        >
          <Printer size={18} strokeWidth={1.5} aria-hidden="true" />
          Imprimir QR de todas as atividades
        </Botao>
      </div>

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
                    <button
                      type="button"
                      className={styles.botaoIcone}
                      aria-label={`Baixar QR code de ${atividade.nome}`}
                      title="Baixar QR code (PNG)"
                      onClick={() =>
                        comTratamento(async () =>
                          baixarQrPng(await credenciamentoAdmin.qrAtividade(edicaoId, atividade.id), `qr-${atividade.nome}`)
                        )
                      }
                    >
                      <Download size={16} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={styles.botaoIcone}
                      aria-label={`Imprimir QR code de ${atividade.nome}`}
                      title="Imprimir QR code"
                      onClick={() =>
                        comTratamento(() =>
                          imprimirQrCodes(async () => [await credenciamentoAdmin.qrAtividade(edicaoId, atividade.id)], {
                            evento: edicao.nome,
                          })
                        )
                      }
                    >
                      <Printer size={16} strokeWidth={1.5} aria-hidden="true" />
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
