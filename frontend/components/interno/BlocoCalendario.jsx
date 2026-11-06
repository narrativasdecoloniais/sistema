import styles from "./BlocoCalendario.module.scss";

// Datas do backend são "ingênuas" (horário de Brasília gravado como UTC) —
// formatadas em UTC para não deslocar o dia.
function partesDoDia(iso) {
  const data = new Date(iso);
  const formatar = (opcoes) =>
    new Intl.DateTimeFormat("pt-BR", { ...opcoes, timeZone: "UTC" }).format(data).replace(/\.$/, "");
  return {
    semana: formatar({ weekday: "short" }),
    dia: formatar({ day: "2-digit" }),
    mes: formatar({ month: "short" }),
    completo: formatar({ weekday: "long", day: "numeric", month: "long" }),
  };
}

// Data como folha de calendário (dia da semana, dia, mês) — lida de relance,
// para apresentação de trabalho no Início e em Minhas submissões.
export default function BlocoCalendario({ iso }) {
  const dia = partesDoDia(iso);
  return (
    <div className={styles.calendario} role="img" aria-label={dia.completo}>
      <span className={styles.semana}>{dia.semana}</span>
      <span className={styles.dia}>{dia.dia}</span>
      <span className={styles.mes}>{dia.mes}</span>
    </div>
  );
}
