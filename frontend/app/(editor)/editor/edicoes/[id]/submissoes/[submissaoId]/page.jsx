import { notFound } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarConteudoSubmissao } from "@/lib/submissoesAdmin";
import EditorSubmissao from "@/components/interno/EditorSubmissao";
import styles from "./page.module.scss";

export const metadata = { title: "Editar trabalho" };

export default async function PaginaEditorSubmissao({ params }) {
  const usuario = await obterUsuarioAtual();
  const podeEditar = temPermissaoSecao(
    usuario,
    "SUBMISSOES_RECEBIMENTO",
    "SUBMISSOES_AVALIACAO",
    "SUBMISSOES_RESULTADO",
    "SUBMISSOES_APRESENTACAO",
    "SUBMISSOES_PUBLICACAO"
  );

  if (!podeEditar) {
    return (
      <main className={styles.aviso}>
        <h1>Sem permissão</h1>
        <p>Você não tem acesso à edição de trabalhos desta edição. Fale com um administrador.</p>
      </main>
    );
  }

  const submissao = await buscarConteudoSubmissao(params.id, params.submissaoId);
  if (!submissao) notFound();

  return <EditorSubmissao edicaoId={params.id} submissaoInicial={submissao} />;
}
