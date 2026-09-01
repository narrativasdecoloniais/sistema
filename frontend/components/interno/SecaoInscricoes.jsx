import { CalendarCheck } from "lucide-react";
import Campo from "@/components/forms/Campo";
import CampoCheckbox from "./CampoCheckbox";
import CabecalhoSecao from "./CabecalhoSecao";
import { paraData, paraHora, combinar } from "@/lib/dataHoraIngenua";
import styles from "./EdicaoForm.module.scss";

export default function SecaoInscricoes({ edicao, erros, aoMudar, aoSalvar, aoMudarImediato }) {
  return (
    <div className={styles.secao}>
      <CabecalhoSecao
        Icone={CalendarCheck}
        titulo="Inscrições"
        descricao="Defina o período em que os participantes podem se inscrever nesta edição pela área do participante."
      />
      <div className={styles.camposSecao}>
        <div className={styles.linha}>
          <Campo
            id="inicioInscricoes"
            rotulo="Início das inscrições"
            type="date"
            value={paraData(edicao.inicioInscricoes)}
            onChange={(evento) =>
              aoMudar("inicioInscricoes", combinar(edicao.inicioInscricoes, { data: evento.target.value }))
            }
            onBlur={aoSalvar}
            erro={erros.inicioInscricoes}
          />
          <Campo
            id="horaInicioInscricoes"
            rotulo="Hora"
            type="time"
            value={paraHora(edicao.inicioInscricoes)}
            onChange={(evento) =>
              aoMudar("inicioInscricoes", combinar(edicao.inicioInscricoes, { hora: evento.target.value }))
            }
            onBlur={aoSalvar}
          />
        </div>
        <div className={styles.linha}>
          <Campo
            id="fimInscricoes"
            rotulo="Fim das inscrições"
            type="date"
            value={paraData(edicao.fimInscricoes)}
            onChange={(evento) =>
              aoMudar("fimInscricoes", combinar(edicao.fimInscricoes, { data: evento.target.value }))
            }
            onBlur={aoSalvar}
            erro={erros.fimInscricoes}
          />
          <Campo
            id="horaFimInscricoes"
            rotulo="Hora"
            type="time"
            value={paraHora(edicao.fimInscricoes)}
            onChange={(evento) =>
              aoMudar("fimInscricoes", combinar(edicao.fimInscricoes, { hora: evento.target.value }))
            }
            onBlur={aoSalvar}
          />
        </div>
        <CampoCheckbox
          id="inscricoesEncerradasManualmente"
          rotulo="Encerrar inscrições antecipadamente"
          checked={edicao.inscricoesEncerradasManualmente === true}
          onChange={(valor) => aoMudarImediato("inscricoesEncerradasManualmente", valor)}
        />
        <p className={styles.descricaoSecao}>
          Mesmo desmarcando esta opção, as inscrições só reabrem se a data atual ainda estiver dentro do
          período configurado acima.
        </p>
      </div>
    </div>
  );
}
