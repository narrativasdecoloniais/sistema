"use client";

import { useId, useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import NavegacaoDiasParticipante, {
  idAbaDiaParticipante,
  idPainelDiaParticipante,
} from "./NavegacaoDiasParticipante";
import { DetalhesAtividade } from "./DetalhesAtividadeModal";
import { formatarDiaAtividade, formatarFaixaHorario } from "@/lib/publico";
import { haSobreposicao, agruparAtividadesPorDia, agruparAtividadesSimultaneas } from "@/lib/inscricao";
import { avisoAtividade } from "@/lib/avisoAtividade";
import styles from "./SeletorAtividadesInscricao.module.scss";

function vagas(atividade) {
  if (atividade.semLimiteVagas) return "Vagas ilimitadas";
  if (atividade.lotada) return null;
  return atividade.vagasRestantes === 1 ? "1 vaga" : `${atividade.vagasRestantes} vagas`;
}

// Faixa de um grupo de atividades simultâneas: do primeiro início ao último fim.
function faixaDoGrupo(grupo) {
  const inicio = grupo.reduce((menor, a) => (a.inicioAtividade < menor ? a.inicioAtividade : menor), grupo[0].inicioAtividade);
  const fim = grupo.reduce((maior, a) => (a.fimAtividade > maior ? a.fimAtividade : maior), grupo[0].fimAtividade);
  return { inicio, fim, rotulo: formatarFaixaHorario(inicio, fim) };
}

// Escolha das atividades com inscrição — passo "Atividades" da primeira
// inscrição e o "Escolher atividades" de quem já está inscrito. Por dia e,
// dentro do dia, por horário (atividades simultâneas juntas), cada uma uma
// linha com checkbox. Marcar uma atividade desmarca as que chocam com ela
// (troca, em vez de bloquear); o que choca com uma inscrição já feita fica
// travado, com o aviso uma vez só no cabeçalho do horário. Quem chama guarda
// o Set e envia tudo de uma vez — o backend revalida (inscricoes.service.js).
export default function SeletorAtividadesInscricao({
  atividades = [],
  inscricoesAtividade = [],
  selecionadas,
  onMudar,
}) {
  const idBase = useId();
  const [diaAtivo, setDiaAtivo] = useState(null);
  const [expandida, setExpandida] = useState(null);
  const [gruposAbertos, setGruposAbertos] = useState(() => new Set());

  const dias = agruparAtividadesPorDia(atividades);
  const chaveAtiva = diaAtivo && dias.some((dia) => dia.chave === diaAtivo) ? diaAtivo : (dias[0]?.chave ?? null);
  const diaAtual = dias.find((dia) => dia.chave === chaveAtiva) ?? null;

  function inscricaoQueChoca(atividade) {
    return inscricoesAtividade.find((item) => haSobreposicao(atividade, item.atividade)) || null;
  }

  function alternar(atividade) {
    const proximo = new Set(selecionadas);
    if (proximo.has(atividade.id)) {
      proximo.delete(atividade.id);
    } else {
      // Troca: sai o que estava marcado no mesmo horário.
      for (const outra of atividades) {
        if (proximo.has(outra.id) && haSobreposicao(atividade, outra)) proximo.delete(outra.id);
      }
      proximo.add(atividade.id);
    }
    onMudar(proximo);
  }

  function alternarGrupo(chave) {
    setGruposAbertos((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(chave)) proximo.delete(chave);
      else proximo.add(chave);
      return proximo;
    });
  }

  if (dias.length === 0) {
    return <p className={styles.vazio}>Não há atividades com inscrição disponíveis.</p>;
  }

  const grupos = agruparAtividadesSimultaneas(diaAtual.atividades);
  const marcadasNoDia = diaAtual.atividades.filter((atividade) => selecionadas.has(atividade.id)).length;

  return (
    <div className={styles.seletor}>
      {dias.length > 1 ? (
        <NavegacaoDiasParticipante dias={dias} chaveAtiva={chaveAtiva} onSelecionar={setDiaAtivo} idBase={idBase} />
      ) : (
        <p className={styles.diaUnico}>{formatarDiaAtividade(diaAtual.inicioIso).completo}</p>
      )}

      <div
        className={styles.dia}
        {...(dias.length > 1
          ? {
              role: "tabpanel",
              id: idPainelDiaParticipante(idBase, diaAtual.chave),
              "aria-labelledby": idAbaDiaParticipante(idBase, diaAtual.chave),
            }
          : {})}
      >
        {marcadasNoDia > 0 && (
          <p className={styles.marcadasNoDia} aria-live="polite">
            {marcadasNoDia === 1 ? "1 atividade marcada neste dia" : `${marcadasNoDia} atividades marcadas neste dia`}
          </p>
        )}

        {grupos.map((grupo) => {
          const faixa = faixaDoGrupo(grupo);
          const chaveGrupo = `${diaAtual.chave}-${faixa.inicio}`;
          const idTituloGrupo = `${idBase}-grupo-${chaveGrupo}`;
          const travas = grupo.map(inscricaoQueChoca);
          // Todas presas à mesma inscrição já feita: o horário está ocupado
          // — mostra o aviso e esconde a lista (dá para abrir, só leitura).
          const ocupadoPor = travas.every((trava) => trava && trava.id === travas[0].id) ? travas[0] : null;
          const listaAberta = !ocupadoPor || gruposAbertos.has(chaveGrupo);

          return (
            <section key={chaveGrupo} className={styles.grupo} aria-labelledby={idTituloGrupo}>
              <div className={styles.grupoCabecalho}>
                <h4 id={idTituloGrupo} className={styles.grupoHorario}>
                  {faixa.rotulo}
                </h4>
                {!ocupadoPor && grupo.length > 1 && (
                  <span className={styles.grupoDica}>Mesmo horário — escolha uma</span>
                )}
              </div>

              {ocupadoPor && (
                <div className={styles.ocupado}>
                  <Lock size={16} strokeWidth={1.5} aria-hidden="true" />
                  <p>
                    Você já está em <strong>{ocupadoPor.atividade.nome}</strong> neste horário. Para trocar, cancele
                    essa inscrição no comprovante.
                  </p>
                  <button
                    type="button"
                    className={styles.linkTexto}
                    aria-expanded={listaAberta}
                    onClick={() => alternarGrupo(chaveGrupo)}
                  >
                    {listaAberta
                      ? "Ocultar"
                      : grupo.length === 1
                        ? "Ver a outra atividade"
                        : `Ver as outras ${grupo.length}`}
                  </button>
                </div>
              )}

              {listaAberta && (
                <ul className={styles.lista}>
                  {grupo.map((atividade, indice) => {
                    const marcada = selecionadas.has(atividade.id);
                    const trava = travas[indice];
                    const aberta = expandida === atividade.id;
                    const idDetalhes = `${idBase}-detalhes-${atividade.id}`;
                    const idCampo = `${idBase}-atividade-${atividade.id}`;
                    const horarioProprio =
                      atividade.inicioAtividade !== faixa.inicio || atividade.fimAtividade !== faixa.fim
                        ? formatarFaixaHorario(atividade.inicioAtividade, atividade.fimAtividade)
                        : null;

                    return (
                      <li
                        key={atividade.id}
                        className={[styles.item, marcada ? styles.itemMarcado : "", trava ? styles.itemTravado : ""]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <label htmlFor={idCampo} className={styles.linha}>
                          <input
                            id={idCampo}
                            type="checkbox"
                            className={styles.checkbox}
                            checked={marcada}
                            disabled={Boolean(trava)}
                            onChange={() => alternar(atividade)}
                          />
                          <span className={styles.texto}>
                            <span className={styles.nome}>{atividade.nome}</span>
                            <span className={styles.meta}>
                              {[atividade.tipoAtividade?.nome, horarioProprio, vagas(atividade)]
                                .filter(Boolean)
                                .join(" · ")}
                              {atividade.lotada && !atividade.semLimiteVagas && (
                                <strong className={styles.lotada}> · Lotada — entra na lista de espera</strong>
                              )}
                            </span>
                            {avisoAtividade(atividade, "INSCRICAO") && (
                              <span className={styles.aviso}>{atividade.destaque}</span>
                            )}
                            {trava && !ocupadoPor && (
                              <span className={styles.conflito}>Choca com “{trava.atividade.nome}”, em que você já está.</span>
                            )}
                          </span>
                        </label>

                        <button
                          type="button"
                          className={styles.botaoDetalhes}
                          aria-expanded={aberta}
                          aria-controls={idDetalhes}
                          aria-label={`${aberta ? "Ocultar" : "Ver"} detalhes de ${atividade.nome}`}
                          title={aberta ? "Ocultar detalhes" : "Ver detalhes"}
                          onClick={() => setExpandida(aberta ? null : atividade.id)}
                        >
                          <ChevronDown
                            size={18}
                            strokeWidth={1.5}
                            aria-hidden="true"
                            className={aberta ? styles.setaAberta : undefined}
                          />
                        </button>

                        {aberta && (
                          <div id={idDetalhes} className={styles.detalhes}>
                            <DetalhesAtividade atividade={atividade} compacto />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
