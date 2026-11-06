"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Plus, Presentation, Printer, User } from "lucide-react";
import { buscarMeuCracha, gerarQrDataUrl } from "@/lib/credenciamento";
import { formatarHoraCurta, formatarPeriodoEdicao } from "@/lib/publico";
import { paraNumeroRomano } from "@/lib/romanos";
import { avisoAtividade } from "@/lib/avisoAtividade";
import styles from "./CartaoInscricaoParticipante.module.scss";

function escaparHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (caractere) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[caractere])
  );
}

// Datas do backend são "ingênuas" (horário de Brasília gravado como UTC) —
// dia formatado em UTC para não deslocar.
function chaveDia(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

function rotuloDia(iso) {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(iso));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const STATUS = {
  CONFIRMADA: { rotulo: "Confirmada", tom: "sucesso" },
  LISTA_ESPERA: { rotulo: "Lista de espera", tom: "alerta" },
};

// Agenda da pessoa no evento: inscrições em atividades (confirmadas e lista
// de espera) e apresentações de trabalho juntas, por dia e por horário.
function montarAgenda(inscricoesAtividade, apresentacoes) {
  const itens = [
    ...inscricoesAtividade.map((item) => ({
      tipo: "atividade",
      chave: `a-${item.id}`,
      inicio: item.atividade.inicioAtividade,
      fim: item.atividade.fimAtividade,
      item,
    })),
    ...apresentacoes.map((trabalho) => ({
      tipo: "apresentacao",
      chave: `p-${trabalho.id}`,
      inicio: trabalho.atividadeApresentacao.inicioAtividade,
      fim: trabalho.atividadeApresentacao.fimAtividade,
      trabalho,
    })),
  ].sort((a, b) => new Date(a.inicio) - new Date(b.inicio));

  const dias = [];
  for (const entrada of itens) {
    const chave = chaveDia(entrada.inicio);
    let dia = dias.find((existente) => existente.chave === chave);
    if (!dia) {
      dia = { chave, rotulo: rotuloDia(entrada.inicio), itens: [] };
      dias.push(dia);
    }
    dia.itens.push(entrada);
  }
  return dias;
}

// Comprovante da área do participante, em forma de ingresso: edição e
// participante ao lado do QR do crachá virtual (o mesmo da aba "Meu crachá"
// de /participante/credenciamento, que a equipe lê para credenciar e
// registrar presença) e, abaixo, a agenda da pessoa no evento. Impressão via
// popup com HTML standalone na mesma estrutura. Sem o QR (falha ao buscar),
// segue sem ele. O cancelamento por atividade abre o ModalConfirmacao do
// painel (onCancelarAtividade); `onEscolherAtividades` põe o atalho
// "Escolher atividades" no cabeçalho da agenda (só na tela, nunca na impressão).
export default function CartaoInscricaoParticipante({
  edicao,
  inscricoesAtividade = [],
  apresentacoes = [],
  nomeParticipante,
  onCancelarAtividade,
  onEscolherAtividades,
}) {
  const [qrCracha, setQrCracha] = useState(null);
  const agenda = montarAgenda(inscricoesAtividade, apresentacoes);
  const periodo = formatarPeriodoEdicao(edicao.dataInicio, edicao.dataFim);

  useEffect(() => {
    let ativo = true;
    buscarMeuCracha()
      .then((cracha) => gerarQrDataUrl(cracha.token, 480))
      .then((imagem) => {
        if (ativo) setQrCracha(imagem);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  function aoImprimir() {
    const janela = window.open("", "_blank", "width=720,height=900");
    if (!janela) return;

    const blocoAgenda =
      agenda.length === 0
        ? '<p class="vazio">Nenhuma atividade específica escolhida.</p>'
        : agenda
            .map(
              (dia) => `
        <h3>${escaparHtml(dia.rotulo)}</h3>
        <table class="agenda"><tbody>${dia.itens
          .map((entrada) => {
            const horario = `${escaparHtml(formatarHoraCurta(entrada.inicio))}<br/><span>${escaparHtml(
              formatarHoraCurta(entrada.fim)
            )}</span>`;
            if (entrada.tipo === "apresentacao") {
              const { trabalho } = entrada;
              const atividade = trabalho.atividadeApresentacao;
              return `<tr>
                <td class="hora">${horario}</td>
                <td>
                  <span class="rotuloItem">Você apresenta</span><br/>
                  <strong>${escaparHtml(trabalho.titulo)}</strong><br/>
                  <span class="apoio">${escaparHtml(
                    [atividade.nome, atividade.local].filter(Boolean).join(" · ")
                  )}</span>
                </td>
                <td class="status">${trabalho.ordemApresentacao ? `${trabalho.ordemApresentacao}º a apresentar` : ""}</td>
              </tr>`;
            }
            const { item } = entrada;
            return `<tr>
              <td class="hora">${horario}</td>
              <td>
                <strong>${escaparHtml(item.atividade.nome)}</strong>${
                  avisoAtividade(item.atividade, "COMPROVANTE")
                    ? `<br/><span class="destaque">${escaparHtml(item.atividade.destaque)}</span>`
                    : ""
                }
              </td>
              <td class="status">${escaparHtml(STATUS[item.status]?.rotulo || "")}</td>
            </tr>`;
          })
          .join("")}</tbody></table>`
            )
            .join("");

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Comprovante de inscrição</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #201914; margin: 0; padding: 2.5rem 2.25rem; }
  .comprovante { max-width: 640px; margin: 0 auto; }
  .eyebrow { margin: 0 0 0.35rem; font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: #9C4A2F; }
  .topo { display: flex; justify-content: space-between; gap: 1.5rem; align-items: flex-start;
    padding-bottom: 1.25rem; border-bottom: 2px dashed #B87C34; margin-bottom: 1.5rem; }
  h1 { margin: 0 0 0.5rem; font-size: 1.3rem; line-height: 1.3; }
  .dado { margin: 0.2rem 0; font-size: 0.9rem; color: #4D4842; }
  .dado strong { color: #201914; }
  .qr { text-align: center; flex-shrink: 0; }
  .qr img { width: 140px; height: 140px; display: block; }
  .qr p { margin: 0.35rem 0 0; font-size: 0.7rem; color: #4D4842; max-width: 140px; }
  h2 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; color: #9C4A2F; margin: 0 0 0.75rem; }
  h3 { font-size: 0.85rem; margin: 1.1rem 0 0.4rem; color: #201914; }
  table.agenda { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
  table.agenda td { padding: 0.55rem 0; border-bottom: 1px solid #EDE4D4; vertical-align: top; }
  td.hora { width: 4.2rem; font-weight: 700; padding-right: 0.75rem; }
  td.hora span { font-weight: 400; color: #4D4842; }
  td.status { text-align: right; white-space: nowrap; color: #4D4842; padding-left: 1rem; }
  .rotuloItem { font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: #9C4A2F; }
  .apoio { color: #4D4842; font-size: 0.82rem; }
  .destaque { display: inline-block; margin-top: 0.2rem; font-size: 0.82rem; font-weight: 700; color: #9C4A2F; }
  .vazio { color: #4D4842; font-size: 0.9rem; }
  footer { margin-top: 2rem; padding-top: 0.9rem; border-top: 1px dashed #B87C34; font-size: 0.72rem; color: #4D4842; text-align: center; }
  @page { margin: 1.5cm; }
</style>
</head>
<body>
  <div class="comprovante">
    <div class="topo">
      <div>
        <p class="eyebrow">Comprovante de inscrição · ${escaparHtml(paraNumeroRomano(edicao.numero))} edição</p>
        <h1>${escaparHtml(edicao.nome)}</h1>
        <p class="dado">${escaparHtml(periodo)}</p>
        ${nomeParticipante ? `<p class="dado">Participante: <strong>${escaparHtml(nomeParticipante)}</strong></p>` : ""}
        <p class="dado">Emitido em ${escaparHtml(new Date().toLocaleString("pt-BR"))}</p>
      </div>
      ${
        qrCracha
          ? `<div class="qr"><img src="${qrCracha}" alt="QR code do crachá" />
        <p>Crachá: apresente na entrada e nas atividades com inscrição.</p></div>`
          : ""
      }
    </div>

    <h2>Sua agenda no evento</h2>
    ${blocoAgenda}

    <footer>Se você gerar um novo crachá na área do participante, o QR code deste comprovante deixa de valer.<br/>
    Narrativas Interculturais, Decoloniais e Antirracistas em Educação — GPDES/UnB</footer>
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

  return (
    <article className={styles.cartao} aria-label="Comprovante de inscrição">
      <header className={styles.faixa}>
        <span className={styles.rotulo}>Comprovante de inscrição</span>
        <button type="button" className={styles.imprimir} onClick={aoImprimir}>
          <Printer size={16} strokeWidth={1.5} aria-hidden="true" />
          Imprimir
        </button>
      </header>

      {/* Ingresso: dados à esquerda, crachá à direita (embaixo no celular). */}
      <div className={styles.ingresso}>
        <div className={styles.dados}>
          <p className={styles.eyebrow}>{paraNumeroRomano(edicao.numero)} edição</p>
          <h3 className={styles.nomeEdicao}>{edicao.nome}</h3>
          <ul className={styles.dadosLista}>
            {periodo && (
              <li>
                <CalendarDays size={16} strokeWidth={1.5} aria-hidden="true" />
                {periodo}
              </li>
            )}
            {nomeParticipante && (
              <li>
                <User size={16} strokeWidth={1.5} aria-hidden="true" />
                <span>
                  <span className={styles.somenteLeitor}>Participante: </span>
                  <strong>{nomeParticipante}</strong>
                </span>
              </li>
            )}
          </ul>
        </div>

        {qrCracha && (
          <figure className={styles.cracha}>
            <img src={qrCracha} alt="QR code do seu crachá" className={styles.qrCracha} />
            <figcaption className={styles.legendaCracha}>
              <strong>Seu crachá</strong>
              Mostre na entrada e nas atividades com inscrição. Também em{" "}
              <Link href="/participante/credenciamento">Credenciamento</Link>.
            </figcaption>
          </figure>
        )}
      </div>

      <div className={styles.picote} aria-hidden="true" />

      <section className={styles.agenda} aria-labelledby="agenda-comprovante">
        <div className={styles.cabecalhoAgenda}>
          <h3 id="agenda-comprovante" className={styles.tituloAgenda}>
            Sua agenda no evento
          </h3>
          {onEscolherAtividades && (
            <button type="button" className={styles.escolherAtividades} onClick={onEscolherAtividades}>
              <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
              Escolher atividades
            </button>
          )}
        </div>

        {agenda.length === 0 ? (
          <p className={styles.vazio}>Nenhuma atividade específica escolhida ainda.</p>
        ) : (
          agenda.map((dia) => (
            <div key={dia.chave} className={styles.dia}>
              <h4 className={styles.rotuloDia}>{dia.rotulo}</h4>
              <ul className={styles.itens}>
                {dia.itens.map((entrada) => (
                  <li key={entrada.chave} className={styles.item}>
                    <span className={styles.horario}>
                      <span className={styles.horarioInicio}>{formatarHoraCurta(entrada.inicio)}</span>
                      <span className={styles.horarioFim}>{formatarHoraCurta(entrada.fim)}</span>
                    </span>

                    {entrada.tipo === "apresentacao" ? (
                      <div className={styles.itemCorpo}>
                        <span className={styles.rotuloApresentacao}>
                          <Presentation size={14} strokeWidth={1.5} aria-hidden="true" />
                          Você apresenta
                        </span>
                        <span className={styles.itemNome}>{entrada.trabalho.titulo}</span>
                        <span className={styles.itemApoio}>
                          {entrada.trabalho.atividadeApresentacao.nome}
                          {entrada.trabalho.ordemApresentacao && <> · {entrada.trabalho.ordemApresentacao}º a apresentar</>}
                        </span>
                        <span className={styles.itemApoio}>
                          <MapPin size={14} strokeWidth={1.5} aria-hidden="true" />
                          {entrada.trabalho.atividadeApresentacao.local || "Local a definir"}
                        </span>
                      </div>
                    ) : (
                      <div className={styles.itemCorpo}>
                        <span className={styles.itemNome}>{entrada.item.atividade.nome}</span>
                        <span className={`${styles.status} ${styles[`status_${STATUS[entrada.item.status]?.tom}`] || ""}`}>
                          <span className={styles.statusPonto} aria-hidden="true" />
                          {STATUS[entrada.item.status]?.rotulo}
                        </span>
                        {avisoAtividade(entrada.item.atividade, "COMPROVANTE") && (
                          <span className={styles.destaqueAtividade}>{entrada.item.atividade.destaque}</span>
                        )}
                      </div>
                    )}

                    {entrada.tipo === "atividade" && onCancelarAtividade && (
                      <button
                        type="button"
                        className={styles.cancelar}
                        onClick={() => onCancelarAtividade(entrada.item)}
                        aria-label={`Cancelar inscrição em ${entrada.item.atividade.nome}`}
                      >
                        Cancelar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </article>
  );
}
