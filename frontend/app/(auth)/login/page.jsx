import { Suspense } from "react";
import { redirect } from "next/navigation";
import { obterUsuarioAtual, temPapel } from "@/lib/auth";
import { destinoSeguro, ehDestinoInscricao } from "@/lib/destino";
import TelaAutenticacao from "@/components/publico/TelaAutenticacao";
import LoginForm from "@/components/publico/LoginForm";

export default async function PaginaLogin({ searchParams }) {
  const usuario = await obterUsuarioAtual();
  const destino = destinoSeguro(searchParams?.destino);

  if (usuario) {
    redirect(destino || (temPapel(usuario, "ADMIN", "ORGANIZADOR") ? "/admin" : "/participante"));
  }

  const inscricao = ehDestinoInscricao(destino);

  return (
    <TelaAutenticacao
      eyebrow={inscricao ? "Inscrição" : "Área do participante"}
      titulo="Entrar"
      subtitulo={
        inscricao
          ? "Para se inscrever no evento e nas atividades, entre com o CPF (ou, para estrangeiros, o documento) cadastrado no Narrativas. Ainda não tem conta? Crie a sua logo abaixo."
          : "Acesse com o CPF (ou, para estrangeiros, o documento) cadastrado no Narrativas."
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </TelaAutenticacao>
  );
}
