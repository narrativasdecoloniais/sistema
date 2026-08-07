import { notFound } from "next/navigation";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarAtividades } from "@/lib/atividades";
import { listarTiposAtividade } from "@/lib/tiposAtividade";
import { listarTiposParticipacao } from "@/lib/tiposParticipacao";
import AtividadesPainel from "@/components/interno/AtividadesPainel";

export default async function PaginaAtividades({ params }) {
  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const [atividades, tiposAtividade, tiposParticipacao] = await Promise.all([
    listarAtividades(params.id),
    listarTiposAtividade(),
    listarTiposParticipacao(),
  ]);

  return (
    <AtividadesPainel
      edicaoId={params.id}
      atividadesIniciais={atividades}
      tiposAtividade={tiposAtividade}
      tiposParticipacao={tiposParticipacao}
    />
  );
}
