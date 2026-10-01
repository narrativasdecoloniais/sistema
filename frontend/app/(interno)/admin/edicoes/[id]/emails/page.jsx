import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual } from "@/lib/auth";
import { temPapel } from "@/lib/permissoes";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { carregarPainelEmails } from "@/lib/emailsAdmin";
import EmailsPainel from "@/components/interno/EmailsPainel";

// E-mails em massa — só ADMIN (backend: routes/emailsMassa.routes.js).
export default async function PaginaEmails({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPapel(usuario, "ADMIN")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const { modelos, envios, uso } = await carregarPainelEmails(params.id);

  return (
    <EmailsPainel
      edicaoId={params.id}
      edicaoNome={edicao.nome}
      usuarioLogado={usuario}
      modelosIniciais={modelos}
      enviosIniciais={envios}
      usoInicial={uso}
    />
  );
}
