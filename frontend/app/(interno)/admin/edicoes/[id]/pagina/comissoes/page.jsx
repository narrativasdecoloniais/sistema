import { notFound, redirect } from "next/navigation";
import { obterUsuarioAtual, temPermissaoSecao } from "@/lib/auth";
import { buscarEdicaoPorId } from "@/lib/edicoes";
import TextoSecaoForm from "@/components/interno/TextoSecaoForm";

export default async function PaginaComissoesEstilo({ params }) {
  const usuario = await obterUsuarioAtual();
  if (!temPermissaoSecao(usuario, "PAGINA_COMISSOES")) {
    redirect(`/admin/edicoes/${params.id}`);
  }

  const edicao = await buscarEdicaoPorId(params.id);
  if (!edicao) notFound();

  return (
    <TextoSecaoForm
      edicaoInicial={edicao}
      campo="Comissoes"
      titulo="Comissões e Programas"
      descricao="Título e texto da seção 'Comissões e Programas' na página pública — que lista as comissões desta edição e, logo abaixo, os Programas de Pós-Graduação (cadastrados em Configurações → Programas de Pós-Graduação)."
      temCard
      tituloCard="Cores das abas e listas"
      descricaoCard="Cor das abas (uma por Grupo) e da lista que abre dentro de cada uma."
      rotulosCard={{
        fundo: "Cor de fundo dos itens da lista",
        opacidade: "Opacidade do fundo dos itens",
        texto: "Cor do texto",
        textoSecundario: "Cor das abas inativas",
        acento: "Cor de destaque (aba ativa e ícone de abrir/fechar)",
      }}
    />
  );
}
