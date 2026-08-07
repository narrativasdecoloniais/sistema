import { notFound } from "next/navigation";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { paraNumeroRomano } from "@/lib/romanos";
import styles from "./page.module.scss";

function formatarData(valor) {
  return new Date(valor).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default async function PaginaInicioEdicao({ params }) {
  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  return (
    <div className={styles.pagina}>
      <h1 className={styles.titulo}>
        {paraNumeroRomano(edicao.numero)} — {edicao.nome}
      </h1>
      {edicao.dataInicio && edicao.dataFim && (
        <p className={styles.periodo}>
          {formatarData(edicao.dataInicio)} a {formatarData(edicao.dataFim)}
        </p>
      )}
      <p className={styles.texto}>
        Use o menu ao lado para gerenciar participantes, inscrições, programação, submissões
        e credenciamento desta edição.
      </p>
    </div>
  );
}
