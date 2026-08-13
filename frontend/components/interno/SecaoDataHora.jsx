import { CalendarDays } from "lucide-react";
import Campo from "@/components/forms/Campo";
import CampoSelecao from "./CampoSelecao";
import CampoCheckbox from "./CampoCheckbox";
import CabecalhoSecao from "./CabecalhoSecao";
import { paraData, paraHora, combinar } from "@/lib/dataHoraIngenua";
import styles from "./EdicaoForm.module.scss";

const FUSOS = [
  { valor: "America/Noronha", rotulo: "Fernando de Noronha (GMT-2)" },
  { valor: "America/Sao_Paulo", rotulo: "Brasília (GMT-3)" },
  { valor: "America/Manaus", rotulo: "Manaus (GMT-4)" },
  { valor: "America/Rio_Branco", rotulo: "Rio Branco (GMT-5)" },
];

export default function SecaoDataHora({ edicao, erros, aoMudar, aoSalvar, aoMudarImediato }) {
  return (
    <div className={styles.secao}>
      <CabecalhoSecao
        Icone={CalendarDays}
        titulo="Data e hora"
        descricao="Diga aos participantes quando o evento começa e termina para que eles possam fazer planos para comparecer."
      />
      <div className={styles.camposSecao}>
        <div className={styles.linha}>
          <Campo
            id="dataInicio"
            rotulo="Início do evento"
            type="date"
            value={paraData(edicao.dataInicio)}
            onChange={(evento) =>
              aoMudar("dataInicio", combinar(edicao.dataInicio, { data: evento.target.value }))
            }
            onBlur={aoSalvar}
            erro={erros.dataInicio}
          />
          <Campo
            id="horaInicio"
            rotulo="Hora"
            type="time"
            value={paraHora(edicao.dataInicio)}
            onChange={(evento) =>
              aoMudar("dataInicio", combinar(edicao.dataInicio, { hora: evento.target.value }))
            }
            onBlur={aoSalvar}
          />
        </div>
        <div className={styles.linha}>
          <Campo
            id="dataFim"
            rotulo="Fim do evento"
            type="date"
            value={paraData(edicao.dataFim)}
            onChange={(evento) =>
              aoMudar("dataFim", combinar(edicao.dataFim, { data: evento.target.value }))
            }
            onBlur={aoSalvar}
            erro={erros.dataFim}
          />
          <Campo
            id="horaFim"
            rotulo="Hora"
            type="time"
            value={paraHora(edicao.dataFim)}
            onChange={(evento) =>
              aoMudar("dataFim", combinar(edicao.dataFim, { hora: evento.target.value }))
            }
            onBlur={aoSalvar}
          />
        </div>
        <CampoSelecao
          id="fusoHorario"
          rotulo="Fuso horário"
          value={edicao.fusoHorario || "America/Sao_Paulo"}
          onChange={(evento) => aoMudarImediato("fusoHorario", evento.target.value)}
        >
          {FUSOS.map((fuso) => (
            <option key={fuso.valor} value={fuso.valor}>
              {fuso.rotulo}
            </option>
          ))}
        </CampoSelecao>
        <CampoCheckbox
          id="notificarAlteracoes"
          rotulo="Notificar os participantes inscritos, via e-mail, das alterações realizadas"
          checked={edicao.notificarAlteracoes !== false}
          onChange={(valor) => aoMudarImediato("notificarAlteracoes", valor)}
        />
      </div>
    </div>
  );
}
