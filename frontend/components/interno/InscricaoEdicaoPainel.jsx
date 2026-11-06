"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Accessibility, CalendarCheck, HandHeart } from "lucide-react";
import Botao from "@/components/forms/Botao";
import ModalConfirmacao from "./ModalConfirmacao";
import CartaoInscricaoParticipante from "./CartaoInscricaoParticipante";
import CardContribuicaoParticipante, { temContribuicao } from "./CardContribuicaoParticipante";
import CamposAdaptacao from "./CamposAdaptacao";
import Modal from "./Modal";
import ModalInscricao from "./ModalInscricao";
import SeletorAtividadesInscricao from "./SeletorAtividadesInscricao";
import { useToast } from "./ToastProvider";
import { formatarPeriodoEdicao } from "@/lib/publico";
import { paraNumeroRomano } from "@/lib/romanos";
import { adaptacaoInscricaoSchema, extrairErros } from "@/lib/validacao";
import {
  buscarInscricaoEdicao,
  salvarInscricao,
  atualizarAdaptacao,
  cancelarInscricaoAtividade,
  cancelarInscricaoGeral,
} from "@/lib/participanteInscricoes";
import styles from "./InscricaoEdicaoPainel.module.scss";

function plural(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
}

function formatarDiaHora(iso) {
  const data = new Date(iso);
  const [, mes, dia] = data.toISOString().slice(0, 10).split("-");
  return `${dia}/${mes} às ${data.toISOString().slice(11, 16).replace(":", "h")}`;
}

function respostaAdaptacao(inscricaoEdicao) {
  if (inscricaoEdicao?.precisaAdaptacao === true) return inscricaoEdicao.adaptacoesNecessarias;
  if (inscricaoEdicao?.precisaAdaptacao === false) return "Não necessita de adaptação ou recurso específico.";
  return "Você ainda não respondeu.";
}

function situacaoAtividades(inscricoesAtividade) {
  const confirmadas = inscricoesAtividade.filter((item) => item.status === "CONFIRMADA").length;
  const espera = inscricoesAtividade.filter((item) => item.status === "LISTA_ESPERA").length;
  if (confirmadas + espera === 0) return "Nenhuma atividade escolhida ainda.";
  return [
    confirmadas > 0 && plural(confirmadas, "confirmada", "confirmadas"),
    espera > 0 && `${espera} na lista de espera`,
  ]
    .filter(Boolean)
    .join(" · ");
}

// Linha do resumo da inscrição — as mesmas etapas do passo a passo, cada uma
// com a situação e a ação ao lado.
function LinhaResumo({ Icone, titulo, children, acao }) {
  return (
    <li className={styles.linhaResumo}>
      <Icone size={20} strokeWidth={1.5} aria-hidden="true" className={styles.iconeResumo} />
      <div className={styles.textoResumo}>
        <span className={styles.tituloResumo}>{titulo}</span>
        <span className={styles.situacaoResumo}>{children}</span>
      </div>
      {acao && <div className={styles.acaoResumo}>{acao}</div>}
    </li>
  );
}

// Inscrição do participante numa edição. Sem inscrição geral: um convite e o
// botão que abre o passo a passo (ModalInscricao) — `abrirInscricao` (vindo de
// ?inscrever=1, usado pelo Início e por /inscricao) já abre o modal. Inscrito:
// resumo com as etapas (acessibilidade, atividades, contribuição), cada uma
// com sua ação num modal próprio, e o comprovante logo abaixo.
export default function InscricaoEdicaoPainel({ edicaoId, usuario, abrirInscricao = false }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [estado, setEstado] = useState(null);
  const [erro, setErro] = useState(false);
  const [inscrevendo, setInscrevendo] = useState(false);
  const aberturaAutomatica = useRef(abrirInscricao);

  const [confirmando, setConfirmando] = useState(null);
  const [confirmandoCarregando, setConfirmandoCarregando] = useState(false);

  const [editandoAdaptacao, setEditandoAdaptacao] = useState(null);
  const [errosAdaptacao, setErrosAdaptacao] = useState({});
  const [salvandoAdaptacao, setSalvandoAdaptacao] = useState(false);

  const [escolhendoAtividades, setEscolhendoAtividades] = useState(false);
  const [selecionadas, setSelecionadas] = useState(() => new Set());
  const [salvandoAtividades, setSalvandoAtividades] = useState(false);

  const [vendoContribuicao, setVendoContribuicao] = useState(false);

  async function carregar() {
    try {
      const dados = await buscarInscricaoEdicao(edicaoId);
      setEstado(dados);
      setErro(false);
    } catch {
      setErro(true);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edicaoId]);

  // ?inscrever=1 abre o passo a passo uma vez, se ainda dá para se inscrever,
  // e sai da URL para recarregar a página não abrir de novo.
  useEffect(() => {
    if (!estado || !aberturaAutomatica.current) return;
    aberturaAutomatica.current = false;
    window.history.replaceState(window.history.state, "", `/participante/inscricoes/${edicaoId}`);
    if (estado.aberta && !estado.jaInscritoNaEdicao) setInscrevendo(true);
  }, [estado, edicaoId]);

  function aposInscrever() {
    carregar();
    router.refresh();
  }

  function abrirAdaptacao(inscricaoEdicao) {
    setErrosAdaptacao({});
    setEditandoAdaptacao({
      precisaAdaptacao: inscricaoEdicao?.precisaAdaptacao ?? null,
      adaptacoesNecessarias: inscricaoEdicao?.adaptacoesNecessarias || "",
    });
  }

  async function salvarAdaptacao(evento) {
    evento.preventDefault();
    const resultado = adaptacaoInscricaoSchema.safeParse(editandoAdaptacao);
    if (!resultado.success) {
      setErrosAdaptacao(extrairErros(resultado));
      return;
    }

    setSalvandoAdaptacao(true);
    try {
      await atualizarAdaptacao(edicaoId, resultado.data);
      notificar("Resposta sobre adaptações atualizada.");
      setEditandoAdaptacao(null);
      await carregar();
    } catch (erroRequisicao) {
      notificar(erroRequisicao.message, "erro");
    } finally {
      setSalvandoAdaptacao(false);
    }
  }

  function abrirEscolhaAtividades() {
    setSelecionadas(new Set());
    setEscolhendoAtividades(true);
  }


  async function salvarAtividades() {
    if (selecionadas.size === 0) return;
    setSalvandoAtividades(true);
    try {
      await salvarInscricao(edicaoId, [...selecionadas]);
      notificar(
        selecionadas.size === 1 ? "Inscrição na atividade confirmada." : "Inscrições nas atividades confirmadas.",
      );
      setEscolhendoAtividades(false);
      await carregar();
      router.refresh();
    } catch (erroRequisicao) {
      notificar(erroRequisicao.message, "erro");
      // Vagas/conflitos podem ter mudado desde que a lista foi aberta.
      await carregar();
    } finally {
      setSalvandoAtividades(false);
    }
  }

  async function confirmarCancelamento() {
    if (!confirmando) return;
    setConfirmandoCarregando(true);

    try {
      if (confirmando.tipo === "atividade") {
        await cancelarInscricaoAtividade(edicaoId, confirmando.item.id);
        notificar("Inscrição na atividade cancelada.");
      } else {
        await cancelarInscricaoGeral(edicaoId);
        notificar("Inscrição cancelada.");
      }
      await carregar();
      router.refresh();
    } catch (erroRequisicao) {
      notificar(erroRequisicao.message, "erro");
    } finally {
      setConfirmandoCarregando(false);
      setConfirmando(null);
    }
  }

  if (erro) {
    return (
      <div className={styles.vazio}>
        <p>Não foi possível carregar esta inscrição.</p>
      </div>
    );
  }

  if (!estado) {
    return (
      <div className={styles.vazio}>
        <p>Carregando...</p>
      </div>
    );
  }

  const { edicao, aberta, jaInscritoNaEdicao, inscricaoAtual, atividades = [], apresentacoes = [] } = estado;
  const inscricoesAtividade = inscricaoAtual?.inscricoesAtividade || [];
  const inscricaoEdicao = inscricaoAtual?.inscricaoEdicao;
  const periodo = formatarPeriodoEdicao(edicao.dataInicio, edicao.dataFim);

  return (
    <div className={styles.pagina}>
      <div>
        <p className={styles.eyebrow}>{paraNumeroRomano(edicao.numero)} edição</p>
        <h1 className={styles.titulo}>{edicao.nome}</h1>
        {periodo && <p className={styles.periodo}>{periodo}</p>}
      </div>

      {!aberta && (
        <div className={styles.aviso}>
          <p>
            {jaInscritoNaEdicao
              ? "As inscrições desta edição estão encerradas — não dá mais para escolher ou cancelar atividades."
              : "As inscrições desta edição estão encerradas."}
          </p>
        </div>
      )}

      {jaInscritoNaEdicao ? (
        <>
          {/* Comprovante primeiro: crachá e agenda são o que a pessoa vem
              buscar; os ajustes (acessibilidade, atividades, contribuição)
              vêm depois. O cartão já se identifica como "Comprovante de
              inscrição". */}
          <section className={styles.secao} aria-label="Comprovante">
            <CartaoInscricaoParticipante
              edicao={edicao}
              inscricoesAtividade={inscricoesAtividade}
              apresentacoes={apresentacoes}
              nomeParticipante={usuario?.nome}
              onCancelarAtividade={aberta ? (item) => setConfirmando({ tipo: "atividade", item }) : undefined}
              onEscolherAtividades={aberta && atividades.length > 0 ? abrirEscolhaAtividades : undefined}
            />
          </section>

          <section className={styles.secao} aria-labelledby="titulo-resumo">
            <h2 id="titulo-resumo" className={styles.tituloSecao}>
              Ajustes da inscrição
            </h2>
            <ul className={styles.resumo}>
              <LinhaResumo
                Icone={Accessibility}
                titulo="Acessibilidade"
                acao={
                  <Botao type="button" variante="secundario" onClick={() => abrirAdaptacao(inscricaoEdicao)}>
                    {inscricaoEdicao?.precisaAdaptacao == null ? "Responder" : "Alterar"}
                  </Botao>
                }
              >
                {respostaAdaptacao(inscricaoEdicao)}
              </LinhaResumo>

              {(atividades.length > 0 || inscricoesAtividade.length > 0) && (
                <LinhaResumo
                  Icone={CalendarCheck}
                  titulo="Atividades"
                  acao={
                    aberta &&
                    atividades.length > 0 && (
                      <Botao type="button" variante="secundario" onClick={abrirEscolhaAtividades}>
                        Escolher atividades
                      </Botao>
                    )
                  }
                >
                  {situacaoAtividades(inscricoesAtividade)}
                  {aberta && atividades.length === 0 && " Não há outras para escolher."}
                </LinhaResumo>
              )}

              {temContribuicao(edicao) && (
                <LinhaResumo
                  Icone={HandHeart}
                  titulo={edicao.tituloContribuicao || "Contribuição voluntária"}
                  acao={
                    <Botao type="button" variante="secundario" onClick={() => setVendoContribuicao(true)}>
                      Ver como contribuir
                    </Botao>
                  }
                >
                  Opcional — ajuda a manter o evento.
                </LinhaResumo>
              )}
            </ul>
          </section>

          {aberta && (
            <div className={styles.cancelarGeral}>
              <button type="button" className={styles.linkPerigo} onClick={() => setConfirmando({ tipo: "geral" })}>
                Cancelar minha inscrição no evento
              </button>
            </div>
          )}
        </>
      ) : (
        aberta && (
          <section className={styles.convite} aria-labelledby="titulo-convite">
            <h2 id="titulo-convite" className={styles.tituloConvite}>
              Você ainda não está inscrito(a)
            </h2>
            <p className={styles.textoConvite}>
              A inscrição é feita em poucos passos: acessibilidade
              {atividades.length > 0 ? ", escolha das atividades" : ""}
              {temContribuicao(edicao) ? ", contribuição voluntária (opcional)" : ""} e comprovante.
            </p>
            {edicao.fimInscricoes && (
              <p className={styles.apoio}>Inscrições abertas até {formatarDiaHora(edicao.fimInscricoes)}.</p>
            )}
            <div>
              <Botao type="button" onClick={() => setInscrevendo(true)}>
                Inscrever-se
              </Botao>
            </div>
          </section>
        )
      )}

      {inscrevendo && (
        <ModalInscricao
          edicao={edicao}
          atividades={atividades}
          apresentacoes={apresentacoes}
          nomeParticipante={usuario?.nome}
          onInscrito={aposInscrever}
          onFechar={() => setInscrevendo(false)}
        />
      )}

      {editandoAdaptacao && (
        <Modal
          titulo="Acessibilidade"
          onFechar={() => setEditandoAdaptacao(null)}
          rodape={
            <>
              <Botao type="button" variante="secundario" onClick={() => setEditandoAdaptacao(null)}>
                Cancelar
              </Botao>
              <Botao type="submit" form="form-adaptacao" carregando={salvandoAdaptacao}>
                Salvar
              </Botao>
            </>
          }
        >
          <form id="form-adaptacao" className={styles.formularioModal} onSubmit={salvarAdaptacao} noValidate>
            <CamposAdaptacao
              id="adaptacao-edicao"
              valor={editandoAdaptacao}
              onChange={setEditandoAdaptacao}
              erros={errosAdaptacao}
            />
          </form>
        </Modal>
      )}

      {escolhendoAtividades && (
        <Modal
          titulo="Escolher atividades"
          onFechar={() => setEscolhendoAtividades(false)}
          telaCheiaNoCelular
          rodape={
            <>
              <Botao type="button" variante="secundario" onClick={() => setEscolhendoAtividades(false)}>
                Cancelar
              </Botao>
              <Botao
                type="button"
                carregando={salvandoAtividades}
                disabled={selecionadas.size === 0}
                onClick={salvarAtividades}
              >
                {selecionadas.size > 0
                  ? `Inscrever-se · ${plural(selecionadas.size, "atividade", "atividades")}`
                  : "Marque ao menos uma"}
              </Botao>
            </>
          }
        >
          <SeletorAtividadesInscricao
            atividades={atividades}
            inscricoesAtividade={inscricoesAtividade}
            selecionadas={selecionadas}
            onMudar={setSelecionadas}
          />
        </Modal>
      )}

      {vendoContribuicao && (
        <Modal
          titulo={edicao.tituloContribuicao || "Contribuição voluntária"}
          onFechar={() => setVendoContribuicao(false)}
          rodape={
            <Botao type="button" variante="secundario" onClick={() => setVendoContribuicao(false)}>
              Fechar
            </Botao>
          }
        >
          <CardContribuicaoParticipante edicao={edicao} embutido />
        </Modal>
      )}

      {confirmando && (
        <ModalConfirmacao
          titulo={confirmando.tipo === "atividade" ? "Cancelar inscrição na atividade" : "Cancelar inscrição"}
          mensagem={
            confirmando.tipo === "atividade"
              ? `Cancelar sua inscrição em "${confirmando.item.atividade.nome}"?`
              : "Cancelar sua inscrição neste evento também cancela suas inscrições em todas as atividades específicas dele. Essa ação não pode ser desfeita."
          }
          rotuloConfirmar="Cancelar inscrição"
          confirmando={confirmandoCarregando}
          onConfirmar={confirmarCancelamento}
          onCancelar={() => setConfirmando(null)}
        />
      )}
    </div>
  );
}
