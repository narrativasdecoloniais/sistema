import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { listarModalidadesSubmissao } from "@/lib/modalidadesSubmissao";
import NovaSubmissaoAdminForm from "@/components/interno/NovaSubmissaoAdminForm";
import styles from "./page.module.scss";

export default async function PaginaNovaSubmissaoAdmin({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "SUBMISSOES_RECEBIMENTO")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const modalidades = await listarModalidadesSubmissao(params.id);

  return (
    <div className={styles.pagina}>
      <div>
        <h1 className={styles.titulo}>Inserir submissão</h1>
        <p className={styles.descricao}>
          Inclui um trabalho em nome de um autor, mesmo fora do prazo da modalidade. Quem ainda não tem conta recebe
          um convite por e-mail. O trabalho entra na distribuição para os avaliadores como qualquer outro envio.
        </p>
      </div>
      {modalidades.length === 0 ? (
        <p className={styles.descricao}>Cadastre uma modalidade de submissão antes de inserir trabalhos.</p>
      ) : (
        <NovaSubmissaoAdminForm edicaoId={params.id} modalidades={modalidades} />
      )}
    </div>
  );
}
