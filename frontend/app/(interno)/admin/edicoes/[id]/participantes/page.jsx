import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { temPapel } from "@/lib/permissoes";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarParticipantes, listarUsuariosDaEdicao } from "@/lib/participantes";
import ParticipantesPainel from "@/components/interno/ParticipantesPainel";

export default async function PaginaParticipantes({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "PARTICIPANTES")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  // A aba "Usuários" (base inteira, com CPF) é ADMIN-only — pra ORGANIZADOR
  // nem busca, e o painel mostra só a aba "Equipe".
  const souAdmin = temPapel(usuario, "ADMIN");
  const [participantes, usuarios] = await Promise.all([
    listarParticipantes(),
    souAdmin ? listarUsuariosDaEdicao(params.id) : Promise.resolve([]),
  ]);

  return (
    <ParticipantesPainel
      participantesIniciais={participantes}
      usuarios={usuarios}
      usuarioLogado={usuario}
    />
  );
}
