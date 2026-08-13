"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import Botao from "@/components/forms/Botao";
import Modal from "./Modal";
import AtividadeForm from "./AtividadeForm";
import SeletorDiaProgramacao from "./SeletorDiaProgramacao";
import { useToast } from "./ToastProvider";
import { apiClient } from "@/lib/apiClient";
import { agruparAtividadesPorDia } from "@/lib/inscricao";
import { criarMapaCores, corPorMapa } from "@/lib/coresAtividade";
import styles from "./ProgramacaoPainel.module.scss";

// Faixa de horas visível na grade, calculada a partir das próprias
// atividades do dia (com 1h de folga em cada ponta) em vez de um valor fixo
// que cortaria atividades cadastradas fora de uma janela hardcoded.
function calcularFaixaHoras(atividadesDoDia) {
  if (atividadesDoDia.length === 0) {
    return { min: "08:00:00", max: "20:00:00" };
  }

  let minMinutos = Infinity;
  let maxMinutos = -Infinity;

  for (const atividade of atividadesDoDia) {
    const inicio = new Date(atividade.inicioAtividade);
    const fim = new Date(atividade.fimAtividade);
    minMinutos = Math.min(minMinutos, inicio.getUTCHours() * 60 + inicio.getUTCMinutes());
    maxMinutos = Math.max(maxMinutos, fim.getUTCHours() * 60 + fim.getUTCMinutes());
  }

  const horaMin = Math.max(0, Math.floor(minMinutos / 60) - 1);
  const horaMax = Math.min(24, Math.ceil(maxMinutos / 60) + 1);

  return {
    min: `${String(horaMin).padStart(2, "0")}:00:00`,
    max: `${String(horaMax).padStart(2, "0")}:00:00`,
  };
}

function paraEvento(atividade, mapaCores) {
  const cor = corPorMapa(mapaCores, atividade.tipoAtividade?.nome);
  return {
    id: atividade.id,
    title: atividade.nome,
    start: atividade.inicioAtividade,
    end: atividade.fimAtividade,
    backgroundColor: cor,
    // Borda fixa (cor de fundo do cartão, não a cor do evento) — separa
    // visualmente blocos vizinhos da mesma trilha, que sem isso se fundem
    // num retângulo só quando estão lado a lado ou empilhados.
    borderColor: "var(--superficie)",
    textColor: "#ffffff",
    extendedProps: { atividade },
  };
}

// Colunas simultâneas ordenadas por duração (mais longa primeiro/mais à
// esquerda) — atividades que tomam o dia inteiro (ex: "Casa das Mestras")
// funcionam como pano de fundo e ficam mais legíveis ancoradas à esquerda,
// com as sessões mais pontuais fluindo à direita. Quando a duração empata
// (comum — várias sessões de trilhas diferentes todas 8h-12h, por exemplo),
// o FullCalendar por padrão decidiria a ordem por título, o que espalha
// sessões da mesma trilha (ex: "Narrativinhas") em colunas não-adjacentes;
// por isso o desempate é por tipo de atividade primeiro.
function ordenarEventos(a, b) {
  if (a.duration !== b.duration) return b.duration - a.duration;
  const tipoA = a.extendedProps?.atividade?.tipoAtividade?.nome || "";
  const tipoB = b.extendedProps?.atividade?.tipoAtividade?.nome || "";
  if (tipoA !== tipoB) return tipoA.localeCompare(tipoB);
  return (a.title || "").localeCompare(b.title || "");
}

function renderizarEvento(arg) {
  const { atividade } = arg.event.extendedProps;
  return (
    <div className={styles.evento}>
      <span className={styles.eventoHorario}>{arg.timeText}</span>
      <span className={styles.eventoNome}>{atividade.nome}</span>
      {atividade.local && <span className={styles.eventoLocal}>{atividade.local}</span>}
    </div>
  );
}

export default function ProgramacaoPainel({ edicaoId, atividadesIniciais, tiposAtividade, tiposParticipacao }) {
  const router = useRouter();
  const { notificar } = useToast();

  const [atividades, setAtividades] = useState(atividadesIniciais);
  const [chaveDiaSelecionado, setChaveDiaSelecionado] = useState(null);
  const [atividadeEmEdicao, setAtividadeEmEdicao] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);

  const dias = useMemo(() => agruparAtividadesPorDia(atividades), [atividades]);
  const diaAtivo = dias.find((dia) => dia.chave === chaveDiaSelecionado) ?? dias[0] ?? null;
  const mapaCores = useMemo(() => criarMapaCores(tiposAtividade), [tiposAtividade]);

  const eventos = useMemo(
    () => (diaAtivo ? diaAtivo.atividades.map((atividade) => paraEvento(atividade, mapaCores)) : []),
    [diaAtivo, mapaCores]
  );
  const faixaHoras = useMemo(() => calcularFaixaHoras(diaAtivo?.atividades ?? []), [diaAtivo]);

  function abrirCriacao() {
    setAtividadeEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(atividade) {
    setAtividadeEmEdicao(atividade);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setAtividadeEmEdicao(null);
  }

  function aoSalvarFormulario(atividadeSalva) {
    setAtividades((atual) => {
      const jaExiste = atual.some((item) => item.id === atividadeSalva.id);
      return jaExiste
        ? atual.map((item) => (item.id === atividadeSalva.id ? atividadeSalva : item))
        : [...atual, atividadeSalva];
    });
    fecharModal();
    router.refresh();
  }

  async function excluirAtividade(id) {
    try {
      await apiClient.delete(`/edicoes/${edicaoId}/atividades/${id}`);
      setAtividades((atual) => atual.filter((item) => item.id !== id));
      notificar("Atividade excluída com sucesso.");
      fecharModal();
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
    }
  }

  async function aoMudarHorario(info) {
    try {
      const resposta = await apiClient.patch(`/edicoes/${edicaoId}/atividades/${info.event.id}/horario`, {
        inicioAtividade: info.event.start.toISOString(),
        fimAtividade: info.event.end.toISOString(),
      });
      setAtividades((atual) =>
        atual.map((item) => (item.id === resposta.atividade.id ? resposta.atividade : item))
      );
      notificar("Horário atualizado com sucesso.");
      router.refresh();
    } catch (erro) {
      notificar(erro.message, "erro");
      info.revert();
    }
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h1 className={styles.titulo}>Programação</h1>
          <p className={styles.descricao}>
            Arraste uma atividade para mudar o horário, redimensione para mudar a duração, ou
            clique para editar todos os campos.
          </p>
        </div>
        <Botao type="button" onClick={abrirCriacao}>
          <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
          Nova atividade
        </Botao>
      </div>

      {dias.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhuma atividade cadastrada ainda.</p>
          <p className={styles.vazioApoio}>
            Cadastre atividades em Atividades para vê-las aqui na agenda.
          </p>
        </div>
      ) : (
        <>
          <SeletorDiaProgramacao
            dias={dias}
            chaveAtiva={diaAtivo?.chave}
            onSelecionar={setChaveDiaSelecionado}
          />

          <div className={styles.calendarioWrapper}>
            <div className={styles.calendarioMinLargura}>
              <FullCalendar
                key={diaAtivo.chave}
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridDay"
                initialDate={diaAtivo.chave}
                timeZone="UTC"
                locale={ptBrLocale}
                headerToolbar={false}
                dayHeaders={false}
                allDaySlot={false}
                height="75vh"
                scrollTime={faixaHoras.min}
                slotMinTime={faixaHoras.min}
                slotMaxTime={faixaHoras.max}
                slotDuration="00:30:00"
                snapDuration="00:15:00"
                editable
                eventResizableFromStart
                eventDurationEditable
                events={eventos}
                eventOrder={ordenarEventos}
                eventContent={renderizarEvento}
                eventClick={(info) => abrirEdicao(info.event.extendedProps.atividade)}
                eventDrop={aoMudarHorario}
                eventResize={aoMudarHorario}
              />
            </div>
          </div>
        </>
      )}

      {modalAberto && (
        <Modal titulo={atividadeEmEdicao ? "Editar atividade" : "Nova atividade"} onFechar={fecharModal}>
          <AtividadeForm
            edicaoId={edicaoId}
            atividadeInicial={atividadeEmEdicao}
            tiposAtividade={tiposAtividade}
            tiposParticipacao={tiposParticipacao}
            aoSalvar={aoSalvarFormulario}
            aoCancelar={fecharModal}
            aoExcluir={excluirAtividade}
          />
        </Modal>
      )}
    </div>
  );
}
