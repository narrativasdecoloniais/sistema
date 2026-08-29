"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { formatarPeriodoAtividade, formatarPeriodoEdicao } from "@/lib/publico";
import styles from "./CardInscricaoConfirmada.module.scss";

// Card grande = inscrição geral no evento (edição); card aninhado = as
// inscrições em atividades específicas dentro dela. Usado tanto no meio do
// fluxo (lembrete do que já está confirmado antes de escolher mais
// atividades) quanto na tela final de confirmação — visual de comprovante
// (faixa com búzio + "Comprovante de Inscrição", linha de corte tracejada,
// corpo). O búzio vem do sprite de `BuziosSimbolos` montado globalmente por
// `BarraNavegacao` no layout público — não precisa importar aqui. Quando
// `onCancelar` é
// passado, cada atividade ganha um cancelamento com confirmação inline (o
// site público não tem um padrão de modal de confirmação como o
// ModalConfirmacao do admin — aqui o próprio item da lista vira o
// "confirma?" por um instante).
function escaparHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (caractere) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[caractere])
  );
}

export default function CardInscricaoConfirmada({
  titulo = "Sua inscrição",
  edicao,
  inscricoesAtividade = [],
  nomeParticipante,
  onCancelar,
  children,
}) {
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [cancelandoId, setCancelandoId] = useState(null);

  const confirmadas = inscricoesAtividade.filter((item) => item.status === "CONFIRMADA");
  const listaEspera = inscricoesAtividade.filter((item) => item.status === "LISTA_ESPERA");

  async function aoConfirmarCancelamento(item) {
    setCancelandoId(item.id);
    try {
      await onCancelar(item);
    } finally {
      setCancelandoId(null);
      setConfirmandoId(null);
    }
  }

  function aoImprimir() {
    const janela = window.open("", "_blank", "width=720,height=900");
    if (!janela) return;

    const linhasAtividades =
      inscricoesAtividade.length === 0
        ? '<p class="vazio">Nenhuma atividade específica selecionada.</p>'
        : `<table class="atividades"><tbody>${inscricoesAtividade
            .map(
              (item) => `
              <tr>
                <td>
                  <strong>${escaparHtml(item.atividade.nome)}</strong><br/>
                  <span class="periodoAtividade">${escaparHtml(
                    formatarPeriodoAtividade(item.atividade.inicioAtividade, item.atividade.fimAtividade)
                  )}</span>
                </td>
                <td class="status">${item.status === "LISTA_ESPERA" ? "Lista de espera" : "Confirmada"}</td>
              </tr>`
            )
            .join("")}</tbody></table>`;

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Comprovante de inscrição</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, "Times New Roman", serif;
    color: #201914;
    margin: 0;
    padding: 3rem 2.5rem;
  }
  .comprovante { max-width: 620px; margin: 0 auto; }
  .cabecalho { text-align: center; border-bottom: 2px solid #201914; padding-bottom: 1rem; margin-bottom: 1.5rem; }
  .eyebrow { margin: 0 0 0.35rem; font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: #9C4A2F; }
  h1 { margin: 0; font-size: 1.5rem; }
  .periodoEvento { margin: 0.35rem 0 0; font-size: 0.95rem; color: #4D4842; }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; margin: 0 0 1.75rem; font-size: 0.9rem; }
  dt { color: #4D4842; }
  dd { margin: 0; font-weight: 600; }
  h2 {
    font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em;
    border-top: 1px dashed #B87C34; padding-top: 1rem; margin: 0 0 0.75rem; color: #9C4A2F;
  }
  table.atividades { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  table.atividades td { padding: 0.6rem 0; border-bottom: 1px solid #EDE4D4; vertical-align: top; }
  table.atividades td.status { text-align: right; white-space: nowrap; color: #4D4842; padding-left: 1rem; }
  .periodoAtividade { color: #4D4842; font-size: 0.85rem; }
  .vazio { color: #4D4842; font-size: 0.9rem; }
  footer {
    margin-top: 2.5rem; padding-top: 1rem; border-top: 1px dashed #B87C34;
    font-size: 0.75rem; color: #4D4842; text-align: center;
  }
  @page { margin: 1.5cm; }
</style>
</head>
<body>
  <div class="comprovante">
    <div class="cabecalho">
      <p class="eyebrow">Comprovante de Inscrição</p>
      <h1>${escaparHtml(edicao?.nome)}</h1>
      ${
        edicao
          ? `<p class="periodoEvento">${escaparHtml(
              formatarPeriodoEdicao(edicao.dataInicio, edicao.dataFim)
            )}</p>`
          : ""
      }
    </div>

    <dl>
      ${nomeParticipante ? `<dt>Participante</dt><dd>${escaparHtml(nomeParticipante)}</dd>` : ""}
      <dt>Status</dt><dd>${escaparHtml(titulo)}</dd>
      <dt>Emitido em</dt><dd>${escaparHtml(new Date().toLocaleString("pt-BR"))}</dd>
    </dl>

    <h2>Atividades específicas</h2>
    ${linhasAtividades}

    <footer>Narrativas Interculturais, Decoloniais e Antirracistas em Educação — GPDES/UnB</footer>
  </div>
</body>
</html>`;

    janela.document.open();
    janela.document.write(html);
    janela.document.close();
    janela.focus();
    janela.onafterprint = () => janela.close();
    setTimeout(() => janela.print(), 250);
  }

  function renderizarItem(item) {
    const emConfirmacao = confirmandoId === item.id;
    const cancelando = cancelandoId === item.id;

    return (
      <li key={item.id}>
        <strong>{item.atividade.nome}</strong>
        <br />
        {formatarPeriodoAtividade(item.atividade.inicioAtividade, item.atividade.fimAtividade)}

        {onCancelar &&
          (emConfirmacao ? (
            <div className={styles.confirmacao}>
              <span>Cancelar sua inscrição nessa atividade?</span>
              <button
                type="button"
                className={styles.confirmar}
                disabled={cancelando}
                onClick={() => aoConfirmarCancelamento(item)}
              >
                {cancelando ? "Cancelando..." : "Sim, cancelar"}
              </button>
              <button
                type="button"
                className={styles.negar}
                disabled={cancelando}
                onClick={() => setConfirmandoId(null)}
              >
                Não
              </button>
            </div>
          ) : (
            <button type="button" className={styles.cancelar} onClick={() => setConfirmandoId(item.id)}>
              Cancelar inscrição
            </button>
          ))}
      </li>
    );
  }

  return (
    <div className={styles.cartao}>
      <div className={styles.faixa}>
        <svg className={styles.icone} aria-hidden="true" width="18" height="18">
          <use href="#buzio-simbolo-1" width="100%" height="100%" />
        </svg>
        <span className={styles.rotulo}>Comprovante de Inscrição</span>

        {/* Exceção pontual à regra "sem ícones de UI kit no público" (DESIGN.md):
            ação utilitária de imprimir, pedida explicitamente com o ícone Lucide
            já usado na área interna, não como decoração. */}
        <button
          type="button"
          className={styles.imprimir}
          onClick={aoImprimir}
          aria-label="Imprimir comprovante"
          title="Imprimir comprovante"
        >
          <Printer size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.cabecalho}>
        <p className={styles.eyebrow}>{titulo}</p>
        <p className={styles.nomeEdicao}>{edicao?.nome}</p>
        {edicao && (
          <p className={styles.periodo}>{formatarPeriodoEdicao(edicao.dataInicio, edicao.dataFim)}</p>
        )}
        {nomeParticipante && (
          <p className={styles.participante}>
            Participante <strong>{nomeParticipante}</strong>
          </p>
        )}
      </div>

      <div className={styles.atividades}>
        <p className={styles.subtitulo}>Atividades específicas</p>

        {inscricoesAtividade.length === 0 && (
          <p className={styles.vazio}>Nenhuma atividade específica selecionada ainda.</p>
        )}

        {confirmadas.length > 0 && <ul className={styles.lista}>{confirmadas.map(renderizarItem)}</ul>}

        {listaEspera.length > 0 && (
          <>
            <p className={styles.subtituloEspera}>Lista de espera</p>
            <ul className={styles.lista}>{listaEspera.map(renderizarItem)}</ul>
          </>
        )}

        {children && <div className={styles.acaoAtividades}>{children}</div>}
      </div>
    </div>
  );
}
