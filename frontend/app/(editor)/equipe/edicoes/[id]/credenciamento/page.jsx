import { notFound } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import { buscarAtividadesCredenciamento } from "@/lib/credenciamentoAdmin";
import LeitorCrachas from "@/components/interno/LeitorCrachas";
import styles from "./page.module.scss";

export const metadata = { title: "Leitor de crachás" };

// Tela de foco, mobile-first: a equipe lê o crachá virtual dos participantes
// para credenciar no evento ou registrar presença numa atividade.
export default async function PaginaLeitorCrachas({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "CREDENCIAMENTO")) {
    return (
      <main className={styles.aviso}>
        <h1>Sem permissão</h1>
        <p>Você não tem acesso ao credenciamento desta edição. Fale com um administrador.</p>
      </main>
    );
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  const atividades = await buscarAtividadesCredenciamento(params.id);

  return <LeitorCrachas edicao={{ id: edicao.id, nome: edicao.nome }} atividades={atividades || []} />;
}
